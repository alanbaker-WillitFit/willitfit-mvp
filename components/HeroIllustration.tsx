import Image from "next/image";

// Hero illustration uses the locked WillItFit production SVG assets.
// Do not redraw bag geometry here: I001/I002 are the source of truth.
export default function HeroIllustration() {
  return (
    <div
      className="wf-hero-illustration relative mx-auto flex w-full max-w-md items-end justify-center overflow-hidden"
      role="img"
      aria-label="WillitFit cabin bag and personal item illustration"
    >
      {/* Airplane window / travel context only */}
      <div className="wf-hero-window absolute right-4 top-4 bg-navy-700" aria-hidden="true">
        <div className="wf-window-sky wf-hero-window-sky absolute" />
        <div className="wf-hero-cloud-one absolute h-7 w-20 rounded-full bg-white/80" />
        <div className="wf-hero-cloud-two absolute h-8 w-28 rounded-full bg-white/70" />
        <div className="wf-hero-cloud-three absolute h-6 w-16 rounded-full bg-white/60" />
      </div>

      {/* Locked I001 cabin bag */}
      <div className="relative z-10 -mr-4 flex items-end" aria-hidden="true">
        <Image
          src="/assets/icons/cabin-bag-photo-rc4.jpg"
          alt=""
          width={190}
          height={238}
          priority
          className="wf-hero-cabin-bag h-auto"
        />
      </div>

      {/* Locked I002 personal/underseat bag */}
      <div className="relative z-20 -ml-8 mb-1 flex items-end" aria-hidden="true">
        <Image
          src="/assets/icons/personal-item-photo-rc4.jpg"
          alt=""
          width={150}
          height={132}
          priority
          className="wf-hero-personal-bag h-auto"
        />
      </div>
    </div>
  );
}
