import { parseISO } from 'date-fns/parseISO';

import { formatUtcDay } from '../../@generic/utils/format-utc-day.util';

export const toYieldPriceDay = (day: string) => formatUtcDay(parseISO(`${day}T12:00:00`));
