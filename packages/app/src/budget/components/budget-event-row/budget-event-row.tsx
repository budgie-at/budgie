import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { BudgetEventRowHeader } from '../budget-event-row-header/budget-event-row-header';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';

import type { BudgetEventProjectionInterface } from '../../interface/budget-event-projection.interface';

interface Props {
    readonly event: BudgetEventProjectionInterface;
}

export const BudgetEventRow = ({ event }: Props) => {
    const { t } = useLingui();
    const { budget, projection } = event;
    const { formatMonthAndDay } = useFormatDate();
    const { tags } = useGetTagByIdsQuery(isDefined(budget.tagId) ? [budget.tagId] : []);
    const tagTitle = isNotEmptyArray(tags) ? tags[0].title : '';
    const tagLabel = t`Tag ${tagTitle}`;
    const startLabel = isDefined(budget.startsAt) ? formatMonthAndDay(budget.startsAt) : '';
    const endLabel = isDefined(budget.endsAt) ? formatMonthAndDay(budget.endsAt) : '';
    const datesLabel = `${startLabel} – ${endLabel}`;

    const handlePress = () => {
        router.push({ pathname: '/budget/event/[id]', params: { id: String(budget.id) } });
    };

    return (
        <HapticPressable
            accessibilityRole="button"
            className="min-h-[44px] gap-y-sm active:opacity-70"
            testID={BudgetSelector.DetailsEventRow(budget.id)}
            onPress={handlePress}
        >
            <BudgetEventRowHeader event={event} />
            <Text className="text-xs text-secondary-foreground">{tagLabel}</Text>
            <Text className="text-xs text-secondary-foreground">{datesLabel}</Text>
            <BudgetLimitBar
                spent={projection.overall.spent}
                limit={projection.overall.limit}
                tone={BUDGET_PACE_VARIANT[projection.overall.status]}
            />
        </HapticPressable>
    );
};
