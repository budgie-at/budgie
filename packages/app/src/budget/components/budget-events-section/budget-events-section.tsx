import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetEventsQuery } from '../../query/use-get-budget-events.query';
import { BudgetEventRow } from '../budget-event-row/budget-event-row';
import { BudgetListSection } from '../budget-list-section/budget-list-section';

export const BudgetEventsSection = () => {
    const { t } = useLingui();
    const { events } = useGetBudgetEventsQuery();

    const handleAddPress = () => {
        router.push('/budget/event/create');
    };

    const emptyHint = isEmptyArray(events) ? (
        <Text className="text-sm text-secondary-foreground">
            <Trans>Track a trip or project with its own limit. Tagged expenses still count in this budget.</Trans>
        </Text>
    ) : null;

    return (
        <BudgetListSection
            label={t`Events`}
            testID={BudgetSelector.DetailsEventsSection}
            addTestID={BudgetSelector.DetailsEventAddButton}
            onAddPress={handleAddPress}
            emptyHint={emptyHint}
        >
            {events.map(event => (
                <BudgetEventRow key={event.budget.id} event={event} />
            ))}
        </BudgetListSection>
    );
};
