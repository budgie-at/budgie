import { BudgetEntityInterface, BudgetStatusEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useGetCurrentBudgetInstanceQuery } from '../../query/use-get-current-budget-instance.query';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly className?: string;
}

const remainingClassName = cva('text-sm font-medium', {
    variants: {
        isPositiveOrNul: {
            true: 'text-positive-foreground',
            false: 'text-warning-foreground'
        }
    }
});

export const BudgetCard = ({ budget, className }: Props) => {
    const { id, title, status, instrumentId } = budget;

    const { decimalPlaces } = useSettingsContext();
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const { instance } = useGetCurrentBudgetInstanceQuery(id);

    const formatDigits = useFormatDigits(decimalPlaces);

    const navigateToBudget = () => void router.push(`/budget/${id}`);

    const totalPlanned = instance?.totalPlanned ?? 0;
    const totalActual = instance?.totalActual ?? 0;
    const remaining = totalPlanned - totalActual;

    const getStatusIcon = () => {
        if (status === BudgetStatusEnum.DRAFT) {
            return UserIconNameEnum.FileText;
        }

        if (status === BudgetStatusEnum.ARCHIVED) {
            return UserIconNameEnum.Archive;
        }

        return UserIconNameEnum.CheckCircle;
    };

    return (
        <Card onPress={navigateToBudget} className={cn('gap-3 active:scale-xs', className)}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon size={36} iconSize={20} icon={UserIconNameEnum.Wallet} variant="ghost" border={false} />

                    <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                <Icon icon={getStatusIcon()} size={16} className="text-secondary-foreground" />
            </View>

            <BudgetProgressBar planned={totalPlanned} actual={totalActual} />

            <View className="flex-row justify-between">
                <View>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Spent</Trans>
                    </Text>
                    <Text className="text-sm font-medium text-primary">
                        {formatDigits(convertFromMicroUnits(totalActual), instrument?.symbol ?? '')}
                    </Text>
                </View>

                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Remaining</Trans>
                    </Text>
                    <Text className={remainingClassName({ isPositiveOrNul: remaining >= 0 })}>
                        {formatDigits(convertFromMicroUnits(remaining), instrument?.symbol ?? '')}
                    </Text>
                </View>
            </View>
        </Card>
    );
};
