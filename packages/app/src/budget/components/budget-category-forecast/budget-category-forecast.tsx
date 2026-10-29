import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetCategoryForecast = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const formatProtectedAmount = useProtectedAmountLabel();

    const overAmount = formatProtectedAmount(
        convertFromMicroUnits(Math.max(scope.projectedOver ?? 0, scope.spent - scope.limit)),
        currencySymbol
    );
    const runOutDate = isDefined(scope.runOutAt) ? formatMonthAndDay(scope.runOutAt) : '';
    const overLabel = isDefined(scope.projectedOver) ? t`Projected ${overAmount} over` : t`${overAmount} over budget`;
    const noteByStatus: Partial<Record<BudgetPaceStatusEnum, string>> = {
        [BudgetPaceStatusEnum.AHEAD]: t`Runs out about ${runOutDate}`,
        [BudgetPaceStatusEnum.OVER]: overLabel
    };
    const note = noteByStatus[scope.status];

    if (!isDefined(note)) {
        return null;
    }

    return (
        <Text className={cn('text-xs tabular-nums', FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[scope.status]])} numberOfLines={1}>
            {note}
        </Text>
    );
};
