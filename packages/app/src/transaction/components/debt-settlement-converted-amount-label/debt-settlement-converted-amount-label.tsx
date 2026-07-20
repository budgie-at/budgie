import { DebtEventAssociationEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

import type { DebtEventWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly debtEvent: DebtEventWithRelationsEntityInterface;
}

export const DebtSettlementConvertedAmountLabel = ({ debtEvent }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const debtInstrument = debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument;

    return (
        <Text className="text-xxs text-secondary-foreground text-right">
            → {formatDigits(convertFromMicroUnits(debtEvent.amount), debtInstrument.symbol)}
        </Text>
    );
};
