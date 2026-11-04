import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children?: ReactNode;
}

export const RecurringCalendarEmptyState = ({ title, children }: Props) => (
    <View testID={RecurringCalendarSelector.EmptyMonth} className="items-center gap-y-xl px-3xl py-7xl">
        <CircleIcon icon={UserIconNameEnum.CalendarSearch} size={48} iconSize={24} variant="ghost" />
        <Text className="text-primary text-[17px] font-semibold text-center">{title}</Text>
        {isDefined(children) ? <Text className="text-secondary-foreground text-[15px] text-center">{children}</Text> : null}
    </View>
);
