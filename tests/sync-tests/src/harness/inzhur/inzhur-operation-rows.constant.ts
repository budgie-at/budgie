import type { InzhurOperationRowInterface } from './inzhur-operation-row.interface';

export const OCEAN = 'Inzhur Ocean';
export const REIT = 'Inzhur REIT';
export const TOP_UP_TYPE = 'Поповнення брокерського рахунку';
const WITHDRAWAL_TYPE = 'Виведення з брокерського рахунку';
export const DIVIDEND_TYPE = 'Нарахування дивідендів';
const TAX_TYPE = 'Сплата податку';
const CONVERSION_TYPE = 'Конвертація';
const SURCHARGE_TYPE = 'Доплата';
export const UNKNOWN_TYPE = 'Комісія за обслуговування';
const TOP_UP_AT = '2026-01-10T10:00:00';
export const TOP_UP_AMOUNT = 10_000;
export const CONVERSION_AT = '2026-03-05T09:00:00';
const WITHDRAWAL_AT = '2026-03-20T15:30:00';
export const CASH_AFTER_HISTORY = 5164;

export const FULL_HISTORY_ROWS: readonly InzhurOperationRowInterface[] = [
    { at: TOP_UP_AT, type: TOP_UP_TYPE, debit: TOP_UP_AMOUNT },
    { at: '2026-01-10T10:05:00', type: 'Купівля 100 сертифікатів', fund: OCEAN, credit: 4000 },
    { at: '2026-01-10T10:06:00', type: 'Купівля 1 сертифікату', fund: REIT, credit: 10 },
    { at: '2026-01-11T10:06:00', type: 'Купівля 49 сертифікатів', fund: REIT, credit: 490 },
    { at: '2026-02-01T12:00:00', type: DIVIDEND_TYPE, fund: OCEAN, debit: 200 },
    { at: '2026-02-01T12:00:05', type: TAX_TYPE, fund: OCEAN, credit: 36 },
    { at: CONVERSION_AT, type: CONVERSION_TYPE, fund: OCEAN, debit: 4300 },
    { at: '2026-03-05T09:00:03', type: CONVERSION_TYPE, fund: REIT, credit: 4290 },
    { at: '2026-03-05T09:00:05', type: SURCHARGE_TYPE, fund: REIT, credit: 10 },
    { at: WITHDRAWAL_AT, type: WITHDRAWAL_TYPE, credit: 500 }
];
