import { UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetListRow } from '../budget-list-row/budget-list-row';
import { BudgetNamedProgressRowHeader } from '../budget-named-progress-row-header/budget-named-progress-row-header';
import { BudgetRowChevron } from '../budget-row-chevron/budget-row-chevron';

import type { BudgetEventProjectionInterface } from '../../interface/budget-event-projection.interface';

interface Props {
    readonly event: BudgetEventProjectionInterface;
}

export const BudgetEventRow = ({ event }: Props) => {
    const { budget, projection } = event;
    const { formatMonthAndDay } = useFormatDate();
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const { tags } = useGetTagByIdsQuery(isDefined(budget.tagId) ? [budget.tagId] : []);
    const tagTitle = isNotEmptyArray(tags) ? tags[0].title : '';
    const startLabel = isDefined(budget.startsAt) ? formatMonthAndDay(budget.startsAt) : '';
    const endLabel = isDefined(budget.endsAt) ? formatMonthAndDay(budget.endsAt) : '';
    const metaLabel = [tagTitle, `${startLabel} – ${endLabel}`].filter(isNotEmptyString).join(' · ');

    const handlePress = () => {
        router.push({ pathname: '/budget/event/[id]', params: { id: String(budget.id) } });
    };

    return (
        <BudgetListRow icon={UserIconNameEnum.CalendarRange} testID={BudgetSelector.DetailsEventRow(budget.id)} onPress={handlePress}>
            <BudgetNamedProgressRowHeader
                name={budget.name}
                amount={projection.overall.spent}
                limit={projection.overall.limit}
                currencySymbol={currencySymbol}
                amountTestID={BudgetSelector.DetailsEventSpentLabel(budget.id)}
                trailing={<BudgetRowChevron />}
            />
            <BudgetLimitBar
                spent={projection.overall.spent}
                limit={projection.overall.limit}
                tone={BUDGET_PACE_VARIANT[projection.overall.status]}
                elapsedFraction={projection.overall.elapsedFraction}
            />
            <Text className="text-xs text-secondary-foreground">{metaLabel}</Text>
        </BudgetListRow>
    );
};
