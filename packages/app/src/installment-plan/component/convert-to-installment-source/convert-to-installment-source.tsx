import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'title' | 'amount' | 'instrumentSymbol' | 'operatedAt'>;
}

export const ConvertToInstallmentSource = ({ params }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const { formatDayAndMonthAndYear } = useFormatDate();

    return (
        <View className="flex-row items-center gap-x-lg rounded-2xl border border-secondary-corner px-xl py-lg">
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                    {params.title}
                </Text>
                <Text className="text-xs text-secondary-foreground">{formatDayAndMonthAndYear(params.operatedAt)}</Text>
            </View>
            <ProtectedText className="text-sm font-medium text-destructive-foreground tabular-nums" numberOfLines={1}>
                -{formatDigits(convertFromMicroUnits(params.amount), params.instrumentSymbol)}
            </ProtectedText>
        </View>
    );
};
