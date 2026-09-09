import Image from 'next/image';

/**
 * A screenshot of the running application.
 *
 * Captured from the live demo tenant, so what is shown is the same seeded farm
 * a visitor reaches by clicking a role on the sign-in page — the alternative
 * being mockups that promise a product the demo then contradicts.
 *
 * Sized 1600x1000 (the 1440x900 capture at 2x, resized), which is what the
 * intrinsic width/height below describe. Getting those wrong is the usual cause
 * of layout shift on an image-heavy marketing page.
 */
export function AppScreenshot({
  src,
  alt,
  caption,
  priority = false,
  className = '',
}: {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`m-0 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.03] p-1.5 shadow-2xl shadow-black/50 sm:rounded-3xl sm:p-2">
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1000}
          priority={priority}
          sizes="(min-width: 1024px) 620px, 100vw"
          className="h-auto w-full rounded-xl sm:rounded-2xl"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-[13px] leading-relaxed text-slate-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
