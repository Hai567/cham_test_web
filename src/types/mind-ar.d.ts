/**
 * Kiểu tối thiểu cho bản build trình duyệt của MindAR (mind-ar không kèm TypeScript types).
 * Chỉ khai báo phần app thực sự dùng: Controller để nhận diện + bám ảnh, Compiler để biên dịch ảnh.
 */
declare module 'mind-ar/dist/mindar-image.prod.js' {
  export type MindARUpdate =
    | { type: 'updateMatrix'; targetIndex: number; worldMatrix: number[] | null }
    | { type: 'processDone' };

  export interface MindARControllerOptions {
    inputWidth: number;
    inputHeight: number;
    onUpdate?: (data: MindARUpdate) => void;
    debugMode?: boolean;
    maxTrack?: number;
    warmupTolerance?: number | null;
    missTolerance?: number | null;
    filterMinCF?: number | null;
    filterBeta?: number | null;
  }

  export class Controller {
    constructor(options: MindARControllerOptions);
    readonly inputWidth: number;
    readonly inputHeight: number;
    addImageTargetsFromBuffer(buffer: ArrayBuffer | Uint8Array): { dimensions: Array<[number, number]> };
    dummyRun(input: HTMLVideoElement): void;
    processVideo(input: HTMLVideoElement): void;
    stopProcessVideo(): void;
    dispose(): void;
    getProjectionMatrix(): number[];
  }

  export class Compiler {
    compileImageTargets(images: Array<HTMLImageElement | HTMLCanvasElement>, onProgress: (percent: number) => void): Promise<unknown>;
    exportData(): Uint8Array;
  }
}
