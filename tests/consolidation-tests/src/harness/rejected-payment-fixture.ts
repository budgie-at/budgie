import { PRECISION } from '@budgie/contracts';

const REJECTED_PAYMENT_AMOUNT_UAH = 41_003;

export const REJECTED_PAYMENT_PRINCIPAL_TITLE =
    'Повернення коштів за забракованим платежем від 23.06.2026 р. на суму 41003.00 UAH на адресу Yehorov Ihor Vitaliiovych (ID платежу повернення 586959892)';
export const REJECTED_PAYMENT_PRINCIPAL_TITLE_ALL_CAPS = REJECTED_PAYMENT_PRINCIPAL_TITLE.toUpperCase();
export const REJECTED_PAYMENT_EXPENSE_AMOUNT = REJECTED_PAYMENT_AMOUNT_UAH * PRECISION;
export const REJECTED_PAYMENT_FEE_TITLE = 'Повернення комісій за використання кредитних коштів';
export const REJECTED_PAYMENT_FEE_AMOUNT = 820_060_000;
export const REJECTED_PAYMENT_FEE_REFUND_DELAY_SECONDS = 60;

export const REJECTED_PAYMENT_HIGH_FEE_PRIMARY_AMOUNT = 100 * PRECISION;
export const REJECTED_PAYMENT_HIGH_FEE_FEE_AMOUNT = 150 * PRECISION;
