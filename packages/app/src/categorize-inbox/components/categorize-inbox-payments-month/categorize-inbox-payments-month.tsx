import { View } from 'react-native';

import { groupCategorizeInboxRowsByDay } from '../../utils/group-categorize-inbox-rows-by-day.util';
import { CategorizeInboxPaymentsDay } from '../categorize-inbox-payments-day/categorize-inbox-payments-day';
import { CategorizeInboxPaymentsMonthHeader } from '../categorize-inbox-payments-month-header/categorize-inbox-payments-month-header';

import type { CategorizeInboxMonthGroupInterface } from '../../interface/categorize-inbox-month-group.interface';

interface Props {
    readonly group: CategorizeInboxMonthGroupInterface;
    readonly displayTitle: string;
    readonly className: string;
}

export const CategorizeInboxPaymentsMonth = ({ group, displayTitle, className }: Props) => {
    const separatorClassName = 'border-t-hairline border-secondary-corner';

    const dayBlocks = groupCategorizeInboxRowsByDay(group.rows).map((dayGroup, index) => {
        const dayClassName = index === 0 ? '' : separatorClassName;

        return (
            <CategorizeInboxPaymentsDay
                key={dayGroup.day.getTime()}
                group={dayGroup}
                displayTitle={displayTitle}
                className={dayClassName}
            />
        );
    });

    return (
        <View className={className}>
            <CategorizeInboxPaymentsMonthHeader group={group} />
            {dayBlocks}
        </View>
    );
};
