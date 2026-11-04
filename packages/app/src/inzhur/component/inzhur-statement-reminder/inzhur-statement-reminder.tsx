import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurStatementReminder = () => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();

    if (!isDefined(reminder)) {
        return null;
    }

    const label = t({ message: plural(reminder.daysOld, { one: 'Statement is # day old', other: 'Statement is # days old' }) });

    return (
        <Text className="text-[13px] text-secondary-foreground" testID={InzhurSelector.StatementReminder}>
            {label}
        </Text>
    );
};
