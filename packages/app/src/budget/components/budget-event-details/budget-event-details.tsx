import { getInclusiveEnd } from '@budgie/budget';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';
import { BudgetDetailsEditButton } from '../budget-details-edit-button/budget-details-edit-button';
import { BudgetDetailsOverview } from '../budget-details-overview/budget-details-overview';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetEventDetails = ({ budget }: Props) => {
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { formatMonthAndDay } = useFormatDate();
    const periodWindow = resolveBudgetWindow(budget, useToday());
    const periodEnd = getInclusiveEnd(periodWindow.nextPeriodStart);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const dateLabel = formatBudgetPeriodLabel(budget, formatMonthAndDay);

    const handleEditPress = () => {
        router.push({ pathname: '/budget/event/[id]/edit', params: { id: String(budget.id) } });
    };

    return (
        <CollapsibleChromePage
            title={budget.name}
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={<BudgetDetailsEditButton onPress={handleEditPress} />}
        >
            <View collapsable={false} className="gap-y-3xl">
                <BudgetDetailsOverview
                    budget={budget}
                    projection={projection}
                    isLoading={isLoading}
                    currencySymbol={currencySymbol}
                    periodStart={periodWindow.periodStart}
                    periodEnd={periodEnd}
                    onPaceHintPress={emptyFn}
                />
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Tagged expenses also count in your main budget.</Trans>
                </Text>
            </View>
        </CollapsibleChromePage>
    );
};
