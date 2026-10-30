import { View } from 'react-native';

import { groupCategorizeInboxRowsByDay } from '../../utils/group-categorize-inbox-rows-by-day.util';
import { CategorizeInboxPaymentsDay } from '../categorize-inbox-payments-day/categorize-inbox-payments-day';
import { CategorizeInboxPaymentsMonthHeader } from '../categorize-inbox-payments-month-header/categorize-inbox-payments-month-header';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
    readonly displayTitle: string;
}

export const CategorizeInboxPaymentsMonth = ({ group, displayTitle }: Props) => {
    const separatorClassName = 'border-t-hairline border-secondary-corner';

    const dayBlocks = groupCategorizeInboxRowsByDay(group.rows).map((dayGroup, index) => {
        const className = index === 0 ? '' : separatorClassName;

        return (
            <CategorizeInboxPaymentsDay key={dayGroup.day.getTime()} group={dayGroup} displayTitle={displayTitle} className={className} />
        );
    });

    return (
        <View>
            <CategorizeInboxPaymentsMonthHeader group={group} />
            {dayBlocks}
        </View>
    );
};
