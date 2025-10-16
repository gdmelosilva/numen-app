import Image from "next/image";
import { useState } from "react";

export function BrandLogoCloud() {
    const logos = [
        "johnson-johnson-logo.webp",
        "nature-co.webp",
        "kenvue.webp",
        "mars.webp",
        "roche.webp",
        "red-bull.webp",
        // "2HeinekenLogo.png",
        // "BRFS_BIG.D-6c46b225-1.png",
        // "Danone-logo-white.png",
        "embraer.webp",
        "dexco.webp",
        "valgroup.webp",
        // "ball-logo.png",
        "elgin.webp",
        // "panasonic-logo-2.png",
        "lg-cns.webp",
        "umicore.webp",
        "tuberfil.webp",
        "hidrovias.webp",
        "porto.webp",
        "cnp-seguros.webp",
        "c6-bank.webp",
        "nu.webp",
        "xp.webp",
        "ebanx.webp",
        "unico.webp",
    ];

    // Track which images failed to load
    const [failed, setFailed] = useState<string[]>([]);

    return (
        <div className="flex flex-wrap justify-center gap-6 py-8">
            {logos.map((logo) =>
                failed.includes(logo) ? null : (
                    <Image
                        key={logo}
                        src={`https://numenit.com/wp-content/uploads/2024/09/${logo}`}
                        alt={logo.replace(/[-_.]/g, " ")}
                        width={50}
                        height={40}
                        className="object-contain grayscale opacity-80 hover:opacity-100 transition invert dark:invert-0 dark:brightness-200"
                        onError={() => setFailed((prev) => [...prev, logo])}
                    />
                )
            )}
        </div>
    );
}
