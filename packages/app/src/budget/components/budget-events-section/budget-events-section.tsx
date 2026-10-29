import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetEventsQuery } from '../../query/use-get-budget-events.query';
import { BudgetEventRow } from '../budget-event-row/budget-event-row';

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
        <EntranceReveal step={5} className="gap-y-lg">
            <View collapsable={false} testID={BudgetSelector.DetailsEventsSection}>
                <SectionHeader
                    label={t`Events`}
                    trailing={<HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.DetailsEventAddButton} />}
                />
                <View className="gap-y-xl">
                    {events.map(event => (
                        <BudgetEventRow key={event.budget.id} event={event} />
                    ))}
                </View>
                {emptyHint}
            </View>
        </EntranceReveal>
    );
};
