import Image, { ImageProps } from "next/image";

export function NumenLogo({ className = "", ...props }: Omit<ImageProps, "src" | "alt" | "width" | "height"> & { className?: string }) {
  // Usa logo diferente para dark e light
  return (
    <>
      <Image
        src="/logo_p.svg"
        alt="Numen Logo"
        width={120}
        height={80}
        className={className + " block dark:hidden"}
        {...props}
      />
      <Image
        src="/logo.svg"
        alt="Numen Logo"
        width={120}
        height={80}
        className={className + " hidden dark:block"}
        {...props}
      />
    </>
  );
}
