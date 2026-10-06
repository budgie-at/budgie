import { Text } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol' | 'operatedAt' | 'accountTitle'>;
}

export const ConvertToInstallmentSource = ({ params }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const { formatDayAndMonthAndYear } = useFormatDate();

    return (
        <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
            {formatDayAndMonthAndYear(params.operatedAt)}
            {' · '}
            <ProtectedText className="tabular-nums">
                {formatDigits(convertFromMicroUnits(params.amount), params.instrumentSymbol)}
            </ProtectedText>
            {' · '}
            {params.accountTitle}
        </Text>
    );
};
