import { DebtEventAssociationEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { DebtEventWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly debtEvent: DebtEventWithRelationsEntityInterface;
}

export const DebtSettlementConvertedAmountLabel = ({ debtEvent }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const debtInstrument = debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument;

    return (
        <Text
            className="text-[13px] leading-[18px] text-secondary-foreground text-right tabular-nums"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {formatDigits(convertFromMicroUnits(debtEvent.amount), debtInstrument.symbol)}
        </Text>
    );
};
