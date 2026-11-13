import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly balance: number;
    readonly instrument: Pick<InstrumentEntityInterface, 'symbol' | 'type'>;
}

export const SecurityQuantityCaption = ({ balance, instrument }: Props) => {
    const formatInstrumentAmount = useFormatInstrumentAmount();

    return (
        <ProtectedText
            className="min-h-[20px] text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums"
            numberOfLines={2}
            placeholderText={PROTECTED_HERO_PLACEHOLDER}
            testID={AccountDetailsSelector.ConvertedValue}
        >
            {formatInstrumentAmount(balance, instrument.symbol, instrument.type)}
        </ProtectedText>
    );
};
