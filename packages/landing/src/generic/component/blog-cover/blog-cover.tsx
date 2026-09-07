/* oxlint-disable lingui/no-unlocalized-strings */
import { isDefined } from '@rnw-community/shared';

import { hashText } from '../../util/hash-text.util';
import { AppShotPicture } from '../app-shot/app-shot-picture';
import { BlogCoverMotif } from '../blog-cover-motif/blog-cover-motif';

import type { BlogCoverShotInterface } from '../../../blog/interface/blog-cover-shot.interface';

interface Props {
    slug: string;
    tags: readonly string[];
    shot?: BlogCoverShotInterface;
}

const HUE_INDIGO = 275;
const HUE_VIOLET = 310;
const HUE_AZURE = 235;
const HUE_TEAL = 168;
const HUE_AMBER = 80;
const HUE_CORAL = 22;
const HUE_WARM_SHIFT = 38;
const HUE_COOL_SHIFT = 34;

const ACCENT_HUES = [HUE_INDIGO, HUE_VIOLET, HUE_AZURE, HUE_TEAL, HUE_AMBER, HUE_CORAL] as const;

const MESH_LAYOUTS = [
    ['120% 95% at 8% 4%', '95% 85% at 92% 30%', '130% 120% at 30% 118%'],
    ['110% 90% at 92% 6%', '100% 90% at 12% 40%', '140% 130% at 70% 120%'],
    ['150% 110% at 50% -10%', '90% 80% at 6% 80%', '120% 110% at 96% 96%']
] as const;

const MOTIF_ANCHORS = ['bottom-[8%] left-[7%]', 'bottom-[8%] right-[7%]', 'bottom-[6%] left-1/2 -translate-x-1/2'] as const;

const MOTIF_SIZES = ['w-[30%] max-w-36', 'w-[44%] max-w-56'] as const;

const GRAIN_STYLE = {
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)' opacity='0.55'/%3E%3C/svg%3E\")"
};

export const BlogCover = ({ slug, tags, shot }: Props) => {
    const [primaryTag = slug] = tags;
    const slugHash = hashText(slug);
    const hasShot = isDefined(shot);
    const accentHue = ACCENT_HUES[hashText(primaryTag) % ACCENT_HUES.length];
    const accentColor = `oklch(0.63 0.16 ${accentHue})`;
    const meshLayout = MESH_LAYOUTS[slugHash % MESH_LAYOUTS.length];
    const motifAnchor = hasShot ? MOTIF_ANCHORS[0] : MOTIF_ANCHORS[slugHash % MOTIF_ANCHORS.length];
    const motifSize = hasShot ? MOTIF_SIZES[0] : MOTIF_SIZES[slugHash % MOTIF_SIZES.length];
    const meshStyle = {
        backgroundImage: [
            `radial-gradient(${meshLayout[0]}, oklch(0.66 0.2 ${accentHue} / 0.5), transparent 64%)`,
            `radial-gradient(${meshLayout[1]}, oklch(0.7 0.16 ${accentHue + HUE_WARM_SHIFT} / 0.36), transparent 60%)`,
            `radial-gradient(${meshLayout[2]}, oklch(0.55 0.15 ${accentHue - HUE_COOL_SHIFT} / 0.42), transparent 72%)`
        ].join(', ')
    };
    const gridStyle = {
        backgroundImage: [
            `repeating-linear-gradient(90deg, oklch(0.55 0.05 ${accentHue} / 0.16) 0 1px, transparent 1px 34px)`,
            `repeating-linear-gradient(0deg, oklch(0.55 0.05 ${accentHue} / 0.16) 0 1px, transparent 1px 34px)`
        ].join(', ')
    };
    const hairlineStyle = { backgroundImage: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` };
    const eyebrowStyle = { color: accentColor };

    return (
        <div className="relative size-full bg-muted">
            <div
                className="absolute inset-0 transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.06]"
                style={meshStyle}
            />

            <div className="absolute inset-0" style={gridStyle} />

            <svg
                aria-hidden="true"
                className={`absolute aspect-square ${motifAnchor} ${motifSize} transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1`}
                viewBox="0 0 120 120"
            >
                <BlogCoverMotif accentColor={accentColor} tags={tags} />
            </svg>

            {hasShot && (
                <div className="absolute right-[6%] -bottom-[8%] h-[74%] w-[30%] max-w-40 rotate-6 overflow-hidden rounded-2xl border border-foreground/10 opacity-95 shadow-2xl transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:rotate-3">
                    <AppShotPicture
                        alt=""
                        asset={shot.light}
                        className="block h-full object-cover object-top dark:hidden"
                        priority={false}
                        sizes="(max-width: 768px) 30vw, 15vw"
                    />

                    <AppShotPicture
                        alt=""
                        asset={shot.dark}
                        className="hidden h-full object-cover object-top dark:block"
                        priority={false}
                        sizes="(max-width: 768px) 30vw, 15vw"
                    />
                </div>
            )}

            <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={GRAIN_STYLE} />

            <span
                className="absolute top-4 left-5 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] uppercase backdrop-blur-sm"
                style={eyebrowStyle}
            >
                {primaryTag}
            </span>

            <span className="absolute inset-x-0 bottom-0 h-px" style={hairlineStyle} />
        </div>
    );
};
