import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { cn } from '../../utils/cn.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly gain: number;
    readonly percent: number | null;
    readonly suffix: string;
    readonly instrumentSymbol: string;
    readonly testID?: string;
}

export const GainLine = ({ gain, percent, suffix, instrumentSymbol, testID }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const formatPercent = useFormatPercent();

    const direction = Math.sign(Math.round(gain * 100));
    const sign = { [-1]: '−', 0: '', 1: '+' }[direction] ?? '';
    const toneClassName = { [-1]: 'text-destructive-foreground', 0: 'text-secondary-foreground', 1: 'text-positive-foreground' }[direction];
    const signedAmount = `${sign}${formatDigits(Math.abs(gain), instrumentSymbol)}`;
    const signedPercent = isDefined(percent) ? `${sign}${formatPercent(Math.abs(percent))}` : null;
    const label = isDefined(signedPercent) ? `${signedAmount} (${signedPercent}) ${suffix}` : `${signedAmount} ${suffix}`;

    return (
        <ProtectedText
            className={cn('px-5xl text-center text-[15px] leading-[20px] font-medium tabular-nums', toneClassName)}
            maxFontSizeMultiplier={2}
            testID={testID}
        >
            {label}
        </ProtectedText>
    );
};
