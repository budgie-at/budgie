import { BudgetPaceStatusEnum } from '@budgie/budget';
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';

const MARK_CLASS_NAME: Record<BudgetPaceStatusEnum, string> = {
    [BudgetPaceStatusEnum.ON_TRACK]: 'bg-positive-gauge',
    [BudgetPaceStatusEnum.TOO_EARLY]: 'bg-positive-gauge',
    [BudgetPaceStatusEnum.AHEAD]: 'bg-warning-fill',
    [BudgetPaceStatusEnum.OVER]: 'bg-destructive-fill'
};

interface Props {
    readonly status: BudgetPaceStatusEnum;
}

export const BudgetStatusLabel = ({ status }: Props) => {
    const { t } = useLingui();
    const isPositive = status === BudgetPaceStatusEnum.ON_TRACK || status === BudgetPaceStatusEnum.TOO_EARLY;
    const isOver = status === BudgetPaceStatusEnum.OVER;
    const isAmountProtected = useIsAmountProtected();

    if (isAmountProtected) {
        return (
            <View className="shrink-0 flex-row items-center gap-x-xs">
                <Icon icon={UserIconNameEnum.Lock} size={15} strokeWidth={2.5} className="text-secondary-foreground" />
                <Text className="text-primary text-sm font-semibold">
                    <Trans>Budget</Trans>
                </Text>
            </View>
        );
    }

    return (
        <View className="shrink-0 flex-row items-center gap-x-xs">
            {isOver ? (
                <Icon icon={UserIconNameEnum.TriangleAlert} size={16} strokeWidth={2.5} className="text-destructive-fill" />
            ) : (
                <View className={cn('h-4 w-4 items-center justify-center rounded-full', MARK_CLASS_NAME[status])}>
                    {isPositive ? (
                        <Icon icon={UserIconNameEnum.Check} size={10} strokeWidth={3.5} className="text-white" />
                    ) : (
                        <Text className="text-white text-[11px] font-black leading-[13px]">!</Text>
                    )}
                </View>
            )}
            <Text className="text-primary text-sm font-semibold">{t(BUDGET_PACE_STATUS_LABEL[status])}</Text>
        </View>
    );
};
