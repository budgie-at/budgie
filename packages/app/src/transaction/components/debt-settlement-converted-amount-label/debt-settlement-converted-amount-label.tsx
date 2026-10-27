import { DebtEventAssociationEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';

import type { DebtEventWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly debtEvent: DebtEventWithRelationsEntityInterface;
}

export const DebtSettlementConvertedAmountLabel = ({ debtEvent }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const debtInstrument = debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument;

    return (
        <Text className="text-xxs text-secondary-foreground text-right">
            → {formatDigits(convertFromMicroUnits(debtEvent.amount), debtInstrument.symbol)}
        </Text>
    );
};
