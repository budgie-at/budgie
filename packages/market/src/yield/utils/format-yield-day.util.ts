const PAD_WIDTH = 2;
const MONTH_OFFSET = 1;

const pad = (value: number) => String(value).padStart(PAD_WIDTH, '0');

export const formatYieldDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + MONTH_OFFSET)}-${pad(date.getDate())}`;
