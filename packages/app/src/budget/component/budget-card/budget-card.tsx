import { BudgetEntityInterface, BudgetStatusEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useGetCurrentBudgetInstanceQuery } from '../../query/use-get-current-budget-instance.query';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly className?: string;
}

export const BudgetCard = ({ budget, className }: Props) => {
    const { id, title, status, instrumentId } = budget;

    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const { instance } = useGetCurrentBudgetInstanceQuery(id);

    const formatDigits = useFormatDigits(0);

    const navigateToBudget = () => void router.push(`/budget/${id}`);

    const totalPlanned = instance?.totalPlanned ?? 0;
    const totalActual = instance?.totalActual ?? 0;
    const remaining = totalPlanned - totalActual;

    const getStatusIcon = () => {
        if (status === BudgetStatusEnum.DRAFT) {
            return 'FileText';
        }

        if (status === BudgetStatusEnum.ARCHIVED) {
            return 'Archive';
        }

        return 'CheckCircle';
    };

    return (
        <Card onPress={navigateToBudget} className={cn('gap-3 active:scale-xs', className)}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon size={36} iconSize={20} icon="Wallet" variant="ghost" border={false} />
                    <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                <Icon icon={getStatusIcon()} size={16} className="text-secondary-foreground" />
            </View>

            <BudgetProgressBar planned={totalPlanned} actual={totalActual} />

            <View className="flex-row justify-between">
                <View>
                    <Text className="text-xs text-secondary-foreground">Spent</Text>
                    <Text className="text-sm font-medium text-primary">
                        {formatDigits(convertFromMicroUnits(totalActual), instrument?.symbol ?? '')}
                    </Text>
                </View>

                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground">Remaining</Text>
                    <Text className={cn('text-sm font-medium', remaining >= 0 ? 'text-positive-foreground' : 'text-warning-foreground')}>
                        {formatDigits(convertFromMicroUnits(remaining), instrument?.symbol ?? '')}
                    </Text>
                </View>
            </View>
        </Card>
    );
};

