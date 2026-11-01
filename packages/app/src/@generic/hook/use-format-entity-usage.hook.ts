import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { isThisYear } from 'date-fns/isThisYear';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

import type { EntityUsageInterface } from '../interface/entity-usage.interface';

export const useFormatEntityUsage = () => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();

    return (usage: EntityUsageInterface | undefined): string | null => {
        if (!isDefined(usage?.lastUsedAt)) {
            return null;
        }

        const transactions = t({ message: plural(usage.transactionCount, { one: '# transaction', other: '# transactions' }) });
        const lastUsed = isThisYear(usage.lastUsedAt) ? formatMonthAndDay(usage.lastUsedAt) : formatDayAndMonthAndYear(usage.lastUsedAt);

        return `${transactions} · ${lastUsed}`;
    };
};
