import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useInstallmentPlanScheduleQuery } from '../../query/use-installment-plan-schedule.query';
import { InstallmentPlanNextPayment } from '../installment-plan-next-payment/installment-plan-next-payment';

import { InstallmentPlanScheduleSummarySelector } from './installment-plan-schedule-summary.selector';

interface Props {
    readonly accountId: number;
    readonly instrumentSymbol: string;
}

export const InstallmentPlanScheduleSummary = ({ accountId, instrumentSymbol }: Props) => {
    const schedule = useInstallmentPlanScheduleQuery(accountId);

    if (!isDefined(schedule) || !isDefined(schedule.nextAmount)) {
        return null;
    }

    const { installmentCount, paidCount } = schedule;

    return (
        <View
            className="flex-row items-center justify-center gap-x-xs pt-lg"
            testID={InstallmentPlanScheduleSummarySelector.Progress(paidCount, installmentCount)}
        >
            <Icon icon={UserIconNameEnum.CalendarClock} className="text-secondary-foreground" size={12} />
            <Text className="text-xs text-secondary-foreground tabular-nums">
                <Trans>
                    {paidCount} of {installmentCount} paid
                </Trans>
            </Text>
            <InstallmentPlanNextPayment
                accountId={accountId}
                instrumentSymbol={instrumentSymbol}
                leading={<Text className="text-xs text-secondary-foreground">·</Text>}
            />
        </View>
    );
};
