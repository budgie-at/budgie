/* oxlint-disable lingui/no-unlocalized-strings */
import { BlogCoverMotifEnum } from '../../enum/blog-cover-motif.enum';

interface Props {
    accentColor: string;
    tags: readonly string[];
}

const MOTIF_KEYWORDS: Record<BlogCoverMotifEnum, readonly string[]> = {
    [BlogCoverMotifEnum.CURRENCY]: ['multi-currency', 'crypto'],
    [BlogCoverMotifEnum.BANK]: ['mint', 'bank', 'monobank', 'erste'],
    [BlogCoverMotifEnum.DEVICE_AI]: ['ai', 'llm', 'on-device', 'voice'],
    [BlogCoverMotifEnum.PRIVACY]: ['privacy', 'security', 'offline-first', 'local-first'],
    [BlogCoverMotifEnum.SOURCE]: ['source', 'open'],
    [BlogCoverMotifEnum.ANALYTICS]: ['analytics', 'exchange', 'rates', 'csv', 'budget']
};

const MOTIF_ORDER = [
    BlogCoverMotifEnum.CURRENCY,
    BlogCoverMotifEnum.BANK,
    BlogCoverMotifEnum.DEVICE_AI,
    BlogCoverMotifEnum.PRIVACY,
    BlogCoverMotifEnum.SOURCE,
    BlogCoverMotifEnum.ANALYTICS
];

const AI_NODES = [
    { x: 48, y: 48 },
    { x: 72, y: 48 },
    { x: 48, y: 72 },
    { x: 72, y: 72 }
];

const CHIP_PINS = [
    'M46 24V34',
    'M60 24V34',
    'M74 24V34',
    'M46 86V96',
    'M60 86V96',
    'M74 86V96',
    'M24 54H34',
    'M24 66H34',
    'M86 54H96',
    'M86 66H96'
];

const resolveMotif = (tags: readonly string[]): BlogCoverMotifEnum =>
    MOTIF_ORDER.find(motif => MOTIF_KEYWORDS[motif].some(keyword => tags.some(tag => tag.includes(keyword)))) ??
    BlogCoverMotifEnum.ANALYTICS;

export const BlogCoverMotif = ({ accentColor, tags }: Props) => {
    const motif = resolveMotif(tags);

    if (motif === BlogCoverMotifEnum.CURRENCY) {
        return (
            <g fill="none" stroke={accentColor} strokeWidth="1.5">
                <circle cx="42" cy="46" opacity="0.75" r="26" />
                <circle cx="76" cy="56" opacity="0.55" r="26" />
                <circle cx="58" cy="84" opacity="0.35" r="26" />
                <path d="M36 38h12M36 46h12M46 38a8 8 0 000 16" opacity="0.9" />
                <path d="M76 44v24M70 50a6 6 0 0112 0c0 8-12 4-12 12a6 6 0 0012 0" opacity="0.7" />
            </g>
        );
    }

    if (motif === BlogCoverMotifEnum.BANK) {
        return (
            <g fill="none" stroke={accentColor} strokeWidth="1.5">
                <path d="M22 52h76a6 6 0 016 6v34a6 6 0 01-6 6H22a6 6 0 01-6-6V58a6 6 0 016-6z" opacity="0.8" />
                <path d="M16 68h88" opacity="0.6" />
                <path d="M28 84h20" opacity="0.9" />
                <path d="M42 34a12 12 0 0112-12 15 15 0 0128 4 10 10 0 01-2 20H48a11 11 0 01-6-12z" opacity="0.45" />
                <path d="M34 12l58 34" opacity="0.85" />
            </g>
        );
    }

    if (motif === BlogCoverMotifEnum.DEVICE_AI) {
        return (
            <g fill="none" stroke={accentColor} strokeWidth="1.5">
                <rect height="52" opacity="0.8" rx="8" width="52" x="34" y="34" />
                {CHIP_PINS.map(pin => (
                    <path key={pin} d={pin} opacity="0.5" />
                ))}
                <path d="M48 48h24v24H48z" opacity="0.3" />
                <path d="M48 48l24 24M72 48L48 72" opacity="0.4" />
                {AI_NODES.map(node => (
                    <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} fill={accentColor} r="2.5" stroke="none" />
                ))}
            </g>
        );
    }

    if (motif === BlogCoverMotifEnum.PRIVACY) {
        return (
            <g fill="none" stroke={accentColor} strokeWidth="1.5">
                <path d="M60 12l42 16v34c0 24-20 40-42 48-22-8-42-24-42-48V28z" opacity="0.85" />
                <circle cx="60" cy="56" opacity="0.9" r="9" />
                <path d="M60 65v14" opacity="0.9" />
                <path d="M8 96A64 64 0 018 24" opacity="0.3" />
                <path d="M112 96a64 64 0 000-72" opacity="0.3" />
            </g>
        );
    }

    if (motif === BlogCoverMotifEnum.SOURCE) {
        return (
            <g fill="none" stroke={accentColor} strokeWidth="1.5">
                <rect height="64" opacity="0.4" rx="8" width="88" x="16" y="28" />
                <path d="M16 44h88" opacity="0.4" />
                <path d="M34 62l12 10-12 10" opacity="0.9" />
                <path d="M54 82h20" opacity="0.9" />
                <path d="M26 36h4M36 36h4" opacity="0.6" />
                <path d="M80 56l10 10-10 10" opacity="0.5" />
            </g>
        );
    }

    return (
        <g fill="none" stroke={accentColor} strokeWidth="1.5">
            <path d="M14 100h94" opacity="0.4" />
            <path d="M14 14v86" opacity="0.4" />
            <path d="M14 100l24-26 22 10 22-30 26-22v78z" fill={accentColor} opacity="0.12" stroke="none" />
            <path d="M14 100l24-26 22 10 22-30 26-22" opacity="0.95" />
            <circle cx="38" cy="74" fill={accentColor} r="3" stroke="none" />
            <circle cx="82" cy="54" fill={accentColor} r="3" stroke="none" />
            <circle cx="108" cy="32" fill={accentColor} r="3" stroke="none" />
        </g>
    );
};
