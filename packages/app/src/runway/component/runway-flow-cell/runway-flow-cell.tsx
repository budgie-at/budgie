import { useAtomValue } from '@effect/atom-react/Hooks';

import { StatCell } from '../../../@generic/component/stat-cell/stat-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { HUNDRED_THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly label: string;
    readonly amount: number;
    readonly variant: ColorPaletteVariant;
}

export const RunwayFlowCell = ({ label, amount, variant }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);
    const formatCompactDigits = useFormatCompactDigits();

    const isAbbreviated = Math.abs(amount) >= HUNDRED_THOUSAND;
    const value = isAbbreviated ? formatCompactDigits(amount, defaultInstrument.symbol) : formatDigits(amount, defaultInstrument.symbol);

    return <StatCell label={label} value={value} variant={variant} />;
};
