import { BudgetPaceStatusEnum } from '@budgie/budget';
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_ICON } from '../../constant/budget-pace-icon.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';

interface Props {
    readonly status: BudgetPaceStatusEnum;
    readonly statusLabel: string;
    readonly daysLeftLabel: string;
    readonly accessibilityLabel: string;
}

const STATUS_ICON_SIZE = 18;
const NOTE_ICON_SIZE = 14;

export const BudgetVerdictHeader = ({ status, statusLabel, daysLeftLabel, accessibilityLabel }: Props) => {
    const statusClassName = FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[status]];

    return (
        <View accessible accessibilityLabel={accessibilityLabel} className="gap-y-sm" testID={BudgetSelector.DetailsVerdict}>
            <View className="flex-row items-center justify-between gap-x-md">
                <View className="flex-row items-center gap-x-sm shrink">
                    <Icon icon={BUDGET_PACE_ICON[status]} size={STATUS_ICON_SIZE} className={cn(statusClassName)} />
                    <Text testID={BudgetSelector.DetailsVerdictStatus} className={cn('text-md font-semibold', statusClassName)}>
                        {statusLabel}
                    </Text>
                </View>
                <MetaPill label={daysLeftLabel} icon={UserIconNameEnum.CalendarDays} />
            </View>

            {status === BudgetPaceStatusEnum.TOO_EARLY ? (
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon={UserIconNameEnum.Hourglass} size={NOTE_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Too early to forecast</Trans>
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
