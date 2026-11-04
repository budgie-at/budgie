import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';

export const RecurringCalendarEmptyState = () => (
    <View testID={RecurringCalendarSelector.EmptyMonth} className="items-center gap-y-xl px-3xl py-7xl">
        <CircleIcon icon={UserIconNameEnum.CalendarSearch} size={48} iconSize={24} variant="ghost" />
        <Text className="text-primary text-[17px] font-semibold text-center">
            <Trans>No recurring payments this month</Trans>
        </Text>
        <Text className="text-secondary-foreground text-[15px] text-center">
            <Trans>Recurring payments will appear here once patterns are detected from your transactions</Trans>
        </Text>
    </View>
);
