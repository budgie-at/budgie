/* oxlint-disable lingui/no-unlocalized-strings */
interface Props {
    slug: string;
    tags: readonly string[];
}

const HUE_INDIGO = 275;
const HUE_VIOLET = 310;
const HUE_AZURE = 235;
const HUE_TEAL = 168;
const HUE_AMBER = 80;
const HUE_CORAL = 22;
const HUE_WARM_SHIFT = 38;
const HUE_COOL_SHIFT = 34;

const HASH_SEED = 7;
const HASH_MULTIPLIER = 31;
const HASH_MODULO = 100003;

const BAR_COUNT = 6;
const BAR_STEPS = 4;
const BAR_STEP_HEIGHT = 9;
const BAR_MIN_HEIGHT = 12;
const BAR_BASELINE = 36;
const BAR_PITCH = 14;
const BAR_WIDTH = 6;
const BAR_BASE_OPACITY = 0.85;
const BAR_OPACITY_STEP = 0.11;
const MOTIF_ROTATION_RANGE = 40;

const ACCENT_HUES = [HUE_INDIGO, HUE_VIOLET, HUE_AZURE, HUE_TEAL, HUE_AMBER, HUE_CORAL] as const;

const BAR_INDEXES = Array.from({ length: BAR_COUNT }, (_, barIndex) => barIndex);

const GRAIN_STYLE = {
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)' opacity='0.55'/%3E%3C/svg%3E\")"
};

const hashText = (value: string): number =>
    Array.from(value).reduce((total, character) => (total * HASH_MULTIPLIER + character.charCodeAt(0)) % HASH_MODULO, HASH_SEED);

export const BlogCover = ({ slug, tags }: Props) => {
    const [primaryTag = slug] = tags;
    const slugHash = hashText(slug);
    const accentHue = ACCENT_HUES[hashText(primaryTag) % ACCENT_HUES.length];
    const accentColor = `oklch(0.63 0.16 ${accentHue})`;
    const meshStyle = {
        backgroundImage: [
            `radial-gradient(120% 95% at 10% 6%, oklch(0.66 0.2 ${accentHue} / 0.5), transparent 64%)`,
            `radial-gradient(95% 85% at 90% 26%, oklch(0.7 0.16 ${accentHue + HUE_WARM_SHIFT} / 0.36), transparent 60%)`,
            `radial-gradient(130% 120% at 28% 118%, oklch(0.55 0.15 ${accentHue - HUE_COOL_SHIFT} / 0.42), transparent 72%)`
        ].join(', ')
    };
    const gridStyle = {
        backgroundImage: [
            `repeating-linear-gradient(90deg, oklch(0.55 0.05 ${accentHue} / 0.16) 0 1px, transparent 1px 34px)`,
            `repeating-linear-gradient(0deg, oklch(0.55 0.05 ${accentHue} / 0.16) 0 1px, transparent 1px 34px)`
        ].join(', ')
    };
    const ringsStyle = { transform: `rotate(${slugHash % MOTIF_ROTATION_RANGE}deg)` };
    const hairlineStyle = { backgroundImage: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` };
    const eyebrowStyle = { color: accentColor };
    const bars = BAR_INDEXES.map(barIndex => {
        const step = Math.floor(slugHash / BAR_STEPS ** (barIndex + 1)) % BAR_STEPS;

        return {
            index: barIndex,
            height: BAR_MIN_HEIGHT + step * BAR_STEP_HEIGHT,
            opacity: BAR_BASE_OPACITY - barIndex * BAR_OPACITY_STEP,
            x: barIndex * BAR_PITCH,
            y: BAR_BASELINE - step * BAR_STEP_HEIGHT
        };
    });

    return (
        <div className="relative size-full bg-muted">
            <div
                className="absolute inset-0 transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.06]"
                style={meshStyle}
            />

            <div className="absolute inset-0" style={gridStyle} />

            <svg
                aria-hidden="true"
                className="absolute -right-[5%] -bottom-[22%] aspect-square w-[42%] max-w-96 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-x-2 motion-safe:group-hover:-translate-y-2"
                style={ringsStyle}
                viewBox="0 0 200 200"
            >
                <g fill="none" stroke={accentColor} strokeWidth="1.5">
                    <circle cx="100" cy="100" opacity="0.6" r="38" />
                    <circle cx="100" cy="100" opacity="0.38" r="64" />
                    <circle cx="100" cy="100" opacity="0.22" r="90" />
                </g>
            </svg>

            <svg aria-hidden="true" className="absolute bottom-[9%] left-[6%] h-[24%] w-[26%]" viewBox="0 0 112 48">
                {bars.map(bar => (
                    <rect
                        key={bar.index}
                        fill={accentColor}
                        height={bar.height}
                        opacity={bar.opacity}
                        rx="3"
                        width={BAR_WIDTH}
                        x={bar.x}
                        y={bar.y}
                    />
                ))}
            </svg>

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
