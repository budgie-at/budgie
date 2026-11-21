import { useYieldScrubDeltaFigures } from '../../hook/use-yield-scrub-delta-figures.hook';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

interface Props {
    readonly current: number;
    readonly previous: number;
    readonly comparison: string;
    readonly flatComparison: string;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;

export const YieldHeroScrubDeltaChip = ({ current, previous, comparison, flatComparison }: Props) => {
    const { label, tone, isFlat } = useYieldScrubDeltaFigures(current, previous);

    const caption = isFlat ? flatComparison : comparison;

    return <YieldDeltaPill label={label} caption={caption} tone={tone} maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER} />;
};
