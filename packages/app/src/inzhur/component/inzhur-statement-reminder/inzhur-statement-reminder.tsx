import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { useState } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurStatementReminder = () => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();
    const [now] = useState(() => new Date());

    if (!isDefined(reminder)) {
        return null;
    }

    const daysOld = differenceInCalendarDays(now, reminder.lastStatementDate);
    const label = t({ message: plural(daysOld, { one: 'Statement is # day old', other: 'Statement is # days old' }) });

    return (
        <Text className="text-[13px] text-secondary-foreground" testID={InzhurSelector.StatementReminder}>
            {label}
        </Text>
    );
};
