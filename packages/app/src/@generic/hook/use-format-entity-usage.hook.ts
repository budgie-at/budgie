import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { isThisYear } from 'date-fns/isThisYear';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

import type { EntityUsageInterface } from '../interface/entity-usage.interface';

export const useFormatEntityUsage = () => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();

    return (usage: EntityUsageInterface | undefined): string => {
        if (!isDefined(usage?.lastUsedAt)) {
            return t`Not used yet`;
        }

        const transactions = t({ message: plural(usage.transactionCount, { one: '# transaction', other: '# transactions' }) });
        const lastUsed = isThisYear(usage.lastUsedAt) ? formatMonthAndDay(usage.lastUsedAt) : formatDayAndMonthAndYear(usage.lastUsedAt);

        return `${transactions} · ${lastUsed}`;
    };
};
