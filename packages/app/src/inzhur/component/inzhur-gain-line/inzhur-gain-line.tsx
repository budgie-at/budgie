import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';

interface Props {
    readonly gain: number;
    readonly percent: number | null;
    readonly suffix: string;
    readonly testID?: string;
}

export const InzhurGainLine = ({ gain, percent, suffix, testID }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const formatPercent = useFormatPercent();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    const direction = Math.sign(Math.round(gain * 100));
    const sign = { [-1]: '−', 0: '', 1: '+' }[direction] ?? '';
    const toneClassName = { [-1]: 'text-destructive-foreground', 0: 'text-secondary-foreground', 1: 'text-positive-foreground' }[direction];
    const signedAmount = `${sign}${formatDigits(Math.abs(gain), symbol)}`;
    const signedPercent = isDefined(percent) ? `${sign}${formatPercent(Math.abs(percent))}` : null;
    const label = isDefined(signedPercent) ? `${signedAmount} (${signedPercent}) ${suffix}` : `${signedAmount} ${suffix}`;

    return (
        <ProtectedText
            className={cn('px-5xl text-center text-[15px] leading-[20px] font-medium tabular-nums', toneClassName)}
            testID={testID}
        >
            {label}
        </ProtectedText>
    );
};
