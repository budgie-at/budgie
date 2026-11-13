import { format } from 'date-fns/format';

const DAY_FORMAT = 'yyyy-MM-dd';

export const formatYieldDay = (date: Date) => format(date, DAY_FORMAT);
