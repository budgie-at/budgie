import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children?: ReactNode;
    readonly testID?: string;
}

export const RecurringCalendarEmptyState = ({ title, children, testID = RecurringCalendarSelector.EmptyMonth }: Props) => (
    <View testID={testID} className="items-center gap-y-xl px-3xl py-7xl rounded-3xl bg-grouped-surface-row">
        <CircleIcon icon={UserIconNameEnum.CalendarSearch} size={48} iconSize={24} variant="ghost" />
        <Text maxFontSizeMultiplier={2} className="text-primary text-[17px] font-semibold text-center">
            {title}
        </Text>
        {isDefined(children) ? (
            <Text maxFontSizeMultiplier={1.8} className="text-secondary-foreground text-[15px] text-center">
                {children}
            </Text>
        ) : null}
    </View>
);
