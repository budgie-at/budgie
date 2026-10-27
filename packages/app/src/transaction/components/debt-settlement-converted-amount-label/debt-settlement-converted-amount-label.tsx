import { DebtEventAssociationEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Text } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { DebtEventWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly debtEvent: DebtEventWithRelationsEntityInterface;
}

export const DebtSettlementConvertedAmountLabel = ({ debtEvent }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const debtInstrument = debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument;

    return (
        <Text className="text-xxs text-secondary-foreground text-right">
            → {formatDigits(convertFromMicroUnits(debtEvent.amount), debtInstrument.symbol)}
        </Text>
    );
};
