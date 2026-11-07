import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useHryvniaInstrumentQuery } from '../query/use-hryvnia-instrument.query';

import type { InzhurValuePointInterface } from '@budgie/sync';

export const useInzhurChartSummary = (points: readonly InzhurValuePointInterface[], startDate: string, subject: string) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    const firstValue = points.at(0)?.value ?? 0;
    const lastValue = points.at(-1)?.value ?? 0;
    const fromLabel = formatDigits(firstValue, symbol);
    const toLabel = formatDigits(lastValue, symbol);
    const sinceLabel = formatMonthAndDayAndOptionalYear(parseISO(startDate));

    return lastValue >= firstValue
        ? t`${subject} rose from ${fromLabel} to ${toLabel} since ${sinceLabel}`
        : t`${subject} fell from ${fromLabel} to ${toLabel} since ${sinceLabel}`;
};
