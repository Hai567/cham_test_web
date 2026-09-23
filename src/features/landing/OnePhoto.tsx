import s2Bg from '../../assets/landing/s2-bg.webp';
import { Display } from './parts';

/** "Một bức ảnh. Hai cách để nhớ." Dải ảnh tràn toàn bề ngang, cao khoảng 31% bề ngang. */
export function OnePhoto() {
  return (
    <section id="san-pham" className="relative scroll-mt-20 overflow-hidden bg-[#F4EBE1] lg:py-[3.4vw]">
      <img
        src={s2Bg}
        width={2560}
        height={500}
        alt="Một tấm ảnh in cặp đôi bên biển, mũi tên vẽ tay dẫn sang chiếc điện thoại đang phát lại cùng khoảnh khắc."
        loading="lazy"
        className="fade-y hidden h-auto w-full lg:block"
      />
      <div className="lwrap pt-14 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:justify-center lg:pt-0">
        <Display className="t-h2">
          Một bức ảnh.
          <br />
          Hai cách để nhớ.
        </Display>
        <span aria-hidden className="mt-[2vw] block h-px w-14 bg-taupe" />
      </div>
      <img src={s2Bg} width={2560} height={500} alt="" aria-hidden loading="lazy" className="mt-8 block h-[300px] w-full object-cover object-[46%_50%] sm:h-[360px] lg:hidden" />
    </section>
  );
}
