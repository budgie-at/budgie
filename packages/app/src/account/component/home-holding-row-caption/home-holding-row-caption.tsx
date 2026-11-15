import { InstrumentTypeEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatCompactQuantity } from '../../../i18n/hook/use-format-compact-quantity.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { HomeHoldingRowSelector } from '../home-holding-row/home-holding-row.selector';

import type { HomeHoldingInterface } from '../../interface/home-holding.interface';

interface Props {
    readonly holding: Pick<HomeHoldingInterface, 'instrument' | 'balance'>;
}

export const HomeHoldingRowCaption = ({ holding }: Props) => {
    const { instrument, balance } = holding;

    const isAmountProtected = useIsAmountProtected();
    const formatCompactQuantity = useFormatCompactQuantity();
    const formatFundQuantity = useFormatFundQuantity();

    const unitLabel = isListedSecurityType(instrument.type) ? instrument.symbol : instrument.code;
    const quantityLabel =
        instrument.type === InstrumentTypeEnum.FUND ? formatFundQuantity(balance) : formatCompactQuantity(balance, unitLabel);
    const caption = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : quantityLabel;

    return (
        <Text
            className="text-[13px] text-secondary-foreground tabular-nums"
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            numberOfLines={1}
            ellipsizeMode="middle"
            testID={HomeHoldingRowSelector.Caption(instrument.code)}
        >
            {caption}
        </Text>
    );
};
