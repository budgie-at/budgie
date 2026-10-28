import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BUDGET_PACE_ICON } from '../../constant/budget-pace-icon.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

const ICON_SIZE = 14;

export const BudgetCategoryForecast = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();

    const toneClassName = FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[scope.status]];
    const overAmount = formatProtectedAmount(
        convertFromMicroUnits(Math.max(scope.projectedOver ?? 0, scope.spent - scope.limit)),
        currencySymbol
    );
    const runOutDate = isDefined(scope.runOutAt) ? formatMonthAndDay(scope.runOutAt) : '';
    const labelByStatus: Record<BudgetPaceStatusEnum, string> = {
        [BudgetPaceStatusEnum.ON_TRACK]: t`On track`,
        [BudgetPaceStatusEnum.TOO_EARLY]: t`On track · Too early to forecast`,
        [BudgetPaceStatusEnum.AHEAD]: t`Projected ${overAmount} over · Runs out ~${runOutDate}`,
        [BudgetPaceStatusEnum.OVER]: isDefined(scope.projectedOver) ? t`Projected ${overAmount} over` : t`${overAmount} over budget`
    };

    return (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={BUDGET_PACE_ICON[scope.status]} size={ICON_SIZE} className={cn(toneClassName)} />
            <Text className={cn('text-xs font-medium tabular-nums shrink', toneClassName)} numberOfLines={1}>
                {labelByStatus[scope.status]}
            </Text>
        </View>
    );
};
