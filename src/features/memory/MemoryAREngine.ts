/**
 * Engine AR cho trang /memory: mở camera sau, nhận diện + bám ảnh bằng MindAR, phủ video lên ảnh bằng three.js.
 *
 * Vì sao mượt:
 * - Hình camera là thẻ <video> gốc, trình duyệt tự vẽ ở tốc độ camera, không đi qua JS hay WebGL.
 * - Bộ nhận diện chạy trên khung hình thu nhỏ (cạnh ngắn 480) nên nhẹ, trong khi hình hiển thị vẫn nét 720p.
 * - Tư thế ảnh (pose) từ MindAR về không đều nhịp (20 đến 40 lần/giây). Vòng vẽ riêng chạy theo màn hình
 *   (60/120 Hz) và nội suy tới pose mới nhất, nên video không giật từng nấc khi di máy.
 * - Chỉ vẽ WebGL khi video đang hiện; lúc đang dò ảnh không tốn GPU cho việc vẽ.
 * - Mép video mờ nhẹ 1,5% để hòa vào ảnh in, che sai lệch vài pixel.
 */
import type { Controller as MindARController, MindARUpdate } from 'mind-ar/dist/mindar-image.prod.js';
import {
  CanvasTexture,
  LinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  VideoTexture,
  WebGLRenderer,
} from 'three';
import { coverFovDeg, coverUv, smoothingAlpha, trackingSize } from './arMath';
import { AREngineError, cameraErrorFrom } from './arErrors';
import { loadMindAR } from './mindar';
import { markMemoryVideoWanted } from './memoryVideo';

/** Tinh chỉnh. Đổi ở đây, không rải số trong code. */
export const AR_TUNING = {
  /** Cạnh ngắn của khung đưa vào bộ nhận diện (xem trackingSize). */
  trackShortSide: 480,
  /** Độ phân giải camera xin trình duyệt, chỉ để hiển thị cho nét. */
  cameraIdeal: { width: 1280, height: 720, frameRate: 30 },
  /** Bộ lọc One Euro của MindAR. minCF nhỏ: đứng yên ít rung hơn. beta lớn: bắt kịp nhanh hơn khi di máy. */
  filterMinCF: 0.001,
  filterBeta: 1000,
  /** Số khung bám liên tiếp trước khi hiện video (tránh nhận nhầm), và số khung mất dấu trước khi ẩn. */
  warmupTolerance: 3,
  missTolerance: 5,
  /** Hằng số thời gian (ms) của bộ nội suy khi vẽ. Nhỏ: bám sát hơn. Lớn: mượt hơn nhưng trễ hơn. */
  smoothTauMs: 28,
  /** Khi ảnh dịch xa hơn tỉ lệ này của bề ngang ảnh giữa hai khung, bám nhanh để không bị kéo đuôi. */
  fastMoveRatio: 0.06,
  fastTauMs: 10,
  fadeMs: 220,
  /** Độ rộng mép mờ, tính theo bề ngang ảnh. */
  edgeFeather: 0.015,
  maxPixelRatio: 2,
} as const;

export type AREngineStatus = 'camera' | 'preparing' | 'scanning' | 'tracking';

export interface AREngineOptions {
  container: HTMLElement;
  memoryVideo: HTMLVideoElement;
  target: Promise<ArrayBuffer>;
  onStatus: (status: AREngineStatus) => void;
  onError: (error: AREngineError) => void;
  /** Trình duyệt chặn phát có tiếng, engine đã tự tắt tiếng để video vẫn chạy. */
  onAutoMuted?: () => void;
}

interface Pose {
  pos: Vector3;
  quat: Quaternion;
  scale: Vector3;
}

const newPose = (): Pose => ({ pos: new Vector3(), quat: new Quaternion(), scale: new Vector3(1, 1, 1) });

type WakeLockSentinelLike = { release: () => Promise<void> };

export class MemoryAREngine {
  private readonly opts: AREngineOptions;
  private destroyed = false;
  private status: AREngineStatus | null = null;

  private stream: MediaStream | null = null;
  private readonly cam: HTMLVideoElement;

  private renderer: WebGLRenderer | null = null;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 10, 100000);
  private mesh: Mesh<PlaneGeometry, MeshBasicMaterial> | null = null;
  private videoTexture: VideoTexture | null = null;
  private alphaTexture: CanvasTexture | null = null;
  private targetAspect = 4 / 3; // cao / rộng, cập nhật từ dữ liệu .mind

  private targetBuffer: ArrayBuffer | null = null;
  private controller: MindARController | null = null;
  private generation = 0;
  private rebuilding = false;
  private readonly postMatrix = new Matrix4();
  private readonly scratch = new Matrix4();

  private tracking = false;
  private hasPose = false;
  private snap = true;
  private readonly target = newPose();
  private readonly current = newPose();
  private opacity = 0;
  private drewVisible = false;

  private raf = 0;
  private lastFrame = 0;
  private resizeObserver: ResizeObserver | null = null;
  private wakeLock: WakeLockSentinelLike | null = null;

  constructor(opts: AREngineOptions) {
    this.opts = opts;
    this.cam = document.createElement('video');
    this.cam.muted = true;
    this.cam.playsInline = true;
    this.cam.autoplay = true;
    this.cam.setAttribute('playsinline', '');
    this.cam.setAttribute('muted', '');
    this.cam.setAttribute('aria-hidden', 'true');
    Object.assign(this.cam.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' });
  }

  async start(): Promise<void> {
    try {
      this.setStatus('camera');
      await this.openCamera();
      if (this.destroyed) return;
      this.setupRenderer();
      this.attachMemoryVideo();
      this.startLoop();
      void this.requestWakeLock();

      this.setStatus('preparing');
      try {
        this.targetBuffer = await this.opts.target;
      } catch (err) {
        throw new AREngineError('target', err);
      }
      if (this.destroyed) return;
      await this.buildController();
      if (this.destroyed) return;
      if (this.status === 'preparing') this.setStatus('scanning');
    } catch (err) {
      if (this.destroyed) return;
      this.fail(err instanceof AREngineError ? err : new AREngineError('unknown', err));
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.cam.removeEventListener('resize', this.onCameraResize);
    this.generation++;
    this.stopController();

    this.stream?.getTracks().forEach((t) => {
      t.removeEventListener('ended', this.onTrackEnded);
      t.stop();
    });
    this.stream = null;
    this.cam.srcObject = null;
    this.cam.remove();

    const v = this.opts.memoryVideo;
    markMemoryVideoWanted(v, false);
    v.pause();
    v.removeEventListener('error', this.onMemoryVideoError);
    v.removeEventListener('loadedmetadata', this.updateVideoUv);
    v.remove();

    this.videoTexture?.dispose();
    this.alphaTexture?.dispose();
    this.mesh?.geometry.dispose();
    this.mesh?.material.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }
    void this.wakeLock?.release().catch(() => undefined);
    this.wakeLock = null;
  }

  // ---------- Camera ----------

  private async openCamera(): Promise<void> {
    if (!window.isSecureContext) throw new AREngineError('insecure');
    if (!navigator.mediaDevices?.getUserMedia) throw new AREngineError('unsupported');

    const { width, height, frameRate } = AR_TUNING.cameraIdeal;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: frameRate } },
      });
    } catch (err) {
      throw cameraErrorFrom(err);
    }
    if (this.destroyed) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    this.stream = stream;
    const track = stream.getVideoTracks()[0];
    track?.addEventListener('ended', this.onTrackEnded);
    if (track) void enableContinuousFocus(track);

    this.cam.srcObject = stream;
    this.opts.container.appendChild(this.cam);
    await waitForMetadata(this.cam);
    try {
      await this.cam.play();
    } catch {
      /* autoplay + muted luôn được phép, nhưng một số trình duyệt ném lỗi giả khi đang chuyển tab */
    }
    this.cam.addEventListener('resize', this.onCameraResize);
  }

  private readonly onTrackEnded = () => {
    if (!this.destroyed) this.fail(new AREngineError('camera-stopped'));
  };

  /** Xoay máy làm khung camera đổi chiều: dựng lại bộ nhận diện theo kích thước mới. */
  private readonly onCameraResize = () => {
    this.layout();
    const { videoWidth: vw, videoHeight: vh } = this.cam;
    const controller = this.controller;
    if (!controller || !vw || !vh || this.rebuilding) return;
    const portraitNow = vh >= vw;
    const portraitTracker = controller.inputHeight >= controller.inputWidth;
    if (portraitNow !== portraitTracker) {
      this.rebuilding = true;
      this.buildController()
        .catch((err: unknown) => this.fail(err instanceof AREngineError ? err : new AREngineError('unknown', err)))
        .finally(() => {
          this.rebuilding = false;
        });
    }
  };

  // ---------- Rendering ----------

  private setupRenderer(): void {
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      throw new AREngineError('webgl', err);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, AR_TUNING.maxPixelRatio));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
    renderer.domElement.setAttribute('aria-hidden', 'true');
    this.opts.container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const texture = new VideoTexture(this.opts.memoryVideo);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    this.videoTexture = texture;

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new Mesh(new PlaneGeometry(1, this.targetAspect), material);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.visible = false;
    this.scene.add(mesh);
    this.mesh = mesh;
    this.applyTargetAspect(this.targetAspect);

    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(this.opts.container);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.layout();
  }

  /** Video kỷ niệm phải nằm trong DOM thì iOS mới giải mã khung hình đều. Để 1 px, trong suốt. */
  private attachMemoryVideo(): void {
    const v = this.opts.memoryVideo;
    Object.assign(v.style, { position: 'absolute', left: '0', top: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
    v.setAttribute('aria-hidden', 'true');
    // Video có thể đã lỗi từ lúc "mồi" trong thao tác chạm, trước khi engine kịp nghe sự kiện.
    if (v.error) throw new AREngineError('video', v.error);
    v.addEventListener('error', this.onMemoryVideoError);
    v.addEventListener('loadedmetadata', this.updateVideoUv);
    this.opts.container.appendChild(v);
    this.updateVideoUv();
  }

  private readonly onMemoryVideoError = () => {
    if (!this.destroyed) this.fail(new AREngineError('video'));
  };

  private readonly updateVideoUv = () => {
    const v = this.opts.memoryVideo;
    if (!this.videoTexture || !v.videoWidth || !v.videoHeight) return;
    const uv = coverUv(v.videoWidth / v.videoHeight, 1 / this.targetAspect);
    this.videoTexture.repeat.set(uv.repeatX, uv.repeatY);
    this.videoTexture.offset.set(uv.offsetX, uv.offsetY);
  };

  private applyTargetAspect(aspect: number): void {
    this.targetAspect = aspect;
    if (!this.mesh) return;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new PlaneGeometry(1, aspect);
    this.alphaTexture?.dispose();
    this.alphaTexture = makeFeatherMask(aspect, AR_TUNING.edgeFeather);
    this.mesh.material.alphaMap = this.alphaTexture;
    this.mesh.material.needsUpdate = true;
    this.updateVideoUv();
  }

  private layout(): void {
    const renderer = this.renderer;
    if (!renderer) return;
    const { clientWidth: cw, clientHeight: ch } = this.opts.container;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch, false);
    const vw = this.cam.videoWidth || cw;
    const vh = this.cam.videoHeight || ch;
    this.camera.fov = coverFovDeg(cw, ch, vw, vh);
    this.camera.aspect = cw / ch;
    this.camera.updateProjectionMatrix();
    this.drewVisible = true; // vẽ lại ít nhất một lần với kích thước mới
  }

  private startLoop(): void {
    this.lastFrame = performance.now();
    const frame = (now: number) => {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(frame);
      const dt = Math.min(Math.max(now - this.lastFrame, 0), 100);
      this.lastFrame = now;
      this.tick(dt);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private tick(dt: number): void {
    const mesh = this.mesh;
    const renderer = this.renderer;
    if (!mesh || !renderer) return;

    if (this.hasPose) {
      const { current: c, target: t } = this;
      if (this.snap) {
        c.pos.copy(t.pos);
        c.quat.copy(t.quat);
        c.scale.copy(t.scale);
        this.snap = false;
      } else {
        const jump = c.pos.distanceTo(t.pos) / Math.max(1e-6, t.scale.x);
        const a = smoothingAlpha(dt, jump > AR_TUNING.fastMoveRatio ? AR_TUNING.fastTauMs : AR_TUNING.smoothTauMs);
        c.pos.lerp(t.pos, a);
        c.quat.slerp(t.quat, a);
        c.scale.lerp(t.scale, a);
      }
      mesh.matrix.compose(c.pos, c.quat, c.scale);
      mesh.matrixWorldNeedsUpdate = true;
    }

    const video = this.opts.memoryVideo;
    const want = this.tracking && this.hasPose && video.readyState >= 2 ? 1 : 0;
    const step = dt / AR_TUNING.fadeMs;
    this.opacity = want > this.opacity ? Math.min(1, this.opacity + step) : Math.max(0, this.opacity - step);
    if (this.opacity === 0 && !this.tracking && !video.paused) {
      markMemoryVideoWanted(video, false);
      video.pause(); // dừng sau khi mờ hẳn, lần sau thấy ảnh thì phát tiếp từ chỗ cũ
    }

    mesh.material.opacity = this.opacity;
    mesh.visible = this.opacity > 0;
    if (mesh.visible || this.drewVisible) {
      renderer.render(this.scene, this.camera);
      this.drewVisible = mesh.visible;
    }
  }

  // ---------- Tracking ----------

  private async buildController(): Promise<void> {
    const buffer = this.targetBuffer;
    if (!buffer) return;
    const { Controller } = await loadMindAR();
    if (this.destroyed) return;

    this.stopController();
    this.setTracking(false);
    const gen = ++this.generation;

    const { w, h } = trackingSize(this.cam.videoWidth, this.cam.videoHeight, AR_TUNING.trackShortSide);
    // MindAR đọc khung hình theo thuộc tính width/height của thẻ video: đặt bằng kích thước bám để
    // nó tự thu nhỏ khung 720p xuống. CSS vẫn quyết định kích thước hiển thị.
    this.cam.width = w;
    this.cam.height = h;

    const controller = new Controller({
      inputWidth: w,
      inputHeight: h,
      maxTrack: 1,
      filterMinCF: AR_TUNING.filterMinCF,
      filterBeta: AR_TUNING.filterBeta,
      warmupTolerance: AR_TUNING.warmupTolerance,
      missTolerance: AR_TUNING.missTolerance,
      onUpdate: (data) => {
        if (gen === this.generation) this.onTrackerUpdate(data);
      },
    });

    let dimensions: Array<[number, number]>;
    try {
      dimensions = controller.addImageTargetsFromBuffer(buffer).dimensions;
    } catch (err) {
      controller.dispose();
      throw new AREngineError('target', err);
    }
    const first = dimensions[0];
    if (!first) {
      controller.dispose(); // file .mind rỗng hoặc sai phiên bản
      throw new AREngineError('target');
    }
    const [mw, mh] = first;
    // Giống MindARThree: đưa gốc về tâm ảnh và đơn vị về "1 = bề ngang ảnh".
    this.postMatrix.compose(new Vector3(mw / 2, mh / 2, 0), new Quaternion(), new Vector3(mw, mw, mw));
    this.applyTargetAspect(mh / mw);

    controller.dummyRun(this.cam); // biên dịch shader GPU trước, tránh khựng ở lần dò đầu tiên
    if (this.destroyed || gen !== this.generation) {
      controller.dispose();
      return;
    }
    this.controller = controller;
    controller.processVideo(this.cam);
    this.layout();
  }

  private stopController(): void {
    const c = this.controller;
    this.controller = null;
    if (!c) return;
    try {
      c.dispose();
    } catch {
      /* đã dừng */
    }
  }

  private onTrackerUpdate(data: MindARUpdate): void {
    if (data.type !== 'updateMatrix') return;
    if (data.worldMatrix) {
      this.scratch.fromArray(data.worldMatrix).multiply(this.postMatrix);
      this.scratch.decompose(this.target.pos, this.target.quat, this.target.scale);
      if (!this.hasPose || !this.tracking) this.snap = true;
      this.hasPose = true;
      this.setTracking(true);
    } else {
      this.setTracking(false);
    }
  }

  private setTracking(on: boolean): void {
    if (this.tracking === on) return;
    this.tracking = on;
    if (on) {
      this.playMemoryVideo();
      this.setStatus('tracking');
    } else if (this.status === 'tracking') {
      this.setStatus('scanning');
    }
  }

  private playMemoryVideo(): void {
    const v = this.opts.memoryVideo;
    markMemoryVideoWanted(v, true);
    v.play().catch(() => {
      if (v.muted) return;
      v.muted = true; // bị chặn phát có tiếng: phát không tiếng còn hơn đứng hình
      this.opts.onAutoMuted?.();
      v.play().catch(() => undefined);
    });
  }

  // ---------- Misc ----------

  private readonly onVisibility = () => {
    const v = this.opts.memoryVideo;
    if (document.hidden) {
      v.pause();
    } else {
      if (this.tracking) this.playMemoryVideo();
      void this.requestWakeLock();
    }
  };

  private async requestWakeLock(): Promise<void> {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };
      if (!nav.wakeLock || document.hidden || this.destroyed) return;
      this.wakeLock = await nav.wakeLock.request('screen');
    } catch {
      /* không hỗ trợ hoặc đang tiết kiệm pin: màn hình có thể tự tắt, không ảnh hưởng AR */
    }
  }

  private setStatus(status: AREngineStatus): void {
    if (this.status === status || this.destroyed) return;
    this.status = status;
    this.opts.onStatus(status);
  }

  private fail(error: AREngineError): void {
    this.opts.onError(error);
    this.destroy();
  }
}

function waitForMetadata(v: HTMLVideoElement): Promise<void> {
  if (v.readyState >= 1 && v.videoWidth) return Promise.resolve();
  return new Promise((resolve) => {
    v.addEventListener('loadedmetadata', () => resolve(), { once: true });
  });
}

/** Lấy nét liên tục nếu camera hỗ trợ (Chrome Android). Ảnh nét thì bám chính xác hơn hẳn. */
async function enableContinuousFocus(track: MediaStreamTrack): Promise<void> {
  try {
    const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { focusMode?: string[] }) | undefined;
    if (caps?.focusMode?.includes('continuous')) {
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
    }
  } catch {
    /* bỏ qua */
  }
}

/** Mặt nạ alpha: đặc ở giữa, mờ dần ở mép để video hòa vào viền ảnh in. */
function makeFeatherMask(aspect: number, feather: number): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  if (!ctx) return texture;
  const img = ctx.createImageData(size, size);
  const fx = feather;
  const fy = feather / Math.max(aspect, 1e-6); // cùng độ rộng thật ở cả bốn cạnh
  const smooth = (e: number, x: number) => {
    const t = Math.min(1, Math.max(0, x / e));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < size; y++) {
    const v = (y + 0.5) / size;
    const ay = smooth(fy, v) * smooth(fy, 1 - v);
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const a = Math.round(255 * ay * smooth(fx, u) * smooth(fx, 1 - u));
      const i = (y * size + x) * 4;
      img.data[i] = a;
      img.data[i + 1] = a;
      img.data[i + 2] = a;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  texture.needsUpdate = true;
  return texture;
}
