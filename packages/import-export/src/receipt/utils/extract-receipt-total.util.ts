import { convertToMicroUnits, CurrencyEnum, LanguageEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { buildReceiptKeywordPattern } from './build-receipt-keyword-pattern.util';

import type { ReceiptTotalInterface } from '../interface/receipt-total.interface';

const TOTAL_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['total', 'grand total', 'amount due', 'balance due', 'amount'],
    [LanguageEnum.FR]: ['total', 'montant', 'à payer', 'net à payer'],
    [LanguageEnum.UK]: ['сума', 'разом', 'до сплати', 'всього'],
    [LanguageEnum.DE]: ['gesamt', 'summe', 'gesamtbetrag', 'betrag', 'zu zahlen', 'endsumme'],
    [LanguageEnum.ES]: ['total', 'importe', 'a pagar']
};

const EXCLUDED_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['subtotal', 'sub total', 'tax', 'vat', 'tip', 'gratuity', 'change', 'tendered', 'given'],
    [LanguageEnum.FR]: ['sous-total', 'tva', 'pourboire', 'rendu', 'donné'],
    [LanguageEnum.UK]: ['пдв', 'решта'],
    [LanguageEnum.DE]: ['zwischensumme', 'ust', 'mwst', 'netto', 'trinkgeld', 'rückgeld', 'gegeben'],
    [LanguageEnum.ES]: ['subtotal', 'iva', 'propina', 'cambio', 'entregado']
};

const CASH_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['cash'],
    [LanguageEnum.FR]: ['espèces'],
    [LanguageEnum.UK]: ['готівка', 'готівкою'],
    [LanguageEnum.DE]: ['bar', 'bargeld'],
    [LanguageEnum.ES]: ['efectivo']
};

const PAYMENT_BRANDS = ['visa', 'mastercard', 'maestro', 'amex', 'american express', 'apple pay', 'google pay', 'v pay', 'contactless'];

const PAYMENT_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['card', 'payment', 'approved'],
    [LanguageEnum.FR]: ['carte', 'paiement', 'sans contact'],
    [LanguageEnum.UK]: ['картка', 'оплата', 'безготівкова', 'безготівковий'],
    [LanguageEnum.DE]: ['zahlung', 'bankomat', 'karte', 'kartenzahlung', 'bezahlt'],
    [LanguageEnum.ES]: ['tarjeta', 'pago']
};

const INCLUSIVE_MARKERS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['incl', 'including', 'included', 'inclusive'],
    [LanguageEnum.FR]: ['incl', 'inclus', 'dont'],
    [LanguageEnum.UK]: ['включно', 'в т.ч'],
    [LanguageEnum.DE]: ['inkl', 'einschl', 'davon'],
    [LanguageEnum.ES]: ['incl', 'incluido', 'incluye']
};

const CURRENCY_SYMBOLS: readonly (readonly [string, CurrencyEnum])[] = [
    ['€', CurrencyEnum.EUR],
    ['$', CurrencyEnum.USD],
    ['£', CurrencyEnum.GBP],
    ['₴', CurrencyEnum.UAH]
];

const CURRENCY_WORDS: Record<LanguageEnum, Readonly<Record<string, CurrencyEnum>>> = {
    [LanguageEnum.EN]: {},
    [LanguageEnum.FR]: {},
    [LanguageEnum.UK]: { грн: CurrencyEnum.UAH },
    [LanguageEnum.DE]: {},
    [LanguageEnum.ES]: {}
};

const CURRENCY_ALIASES: ReadonlyMap<string, CurrencyEnum> = new Map([
    ...CURRENCY_SYMBOLS,
    ...Object.values(CURRENCY_WORDS).flatMap(words => Object.entries(words))
]);

const CURRENCY_CODES = new Map<string, CurrencyEnum>(Object.values(CurrencyEnum).map(code => [code, code]));
const CURRENCY_TOKEN_PATTERN = /\p{L}+|[$£€₴]/gu;
const CURRENCY_CODE_PATTERN = /(?<!\p{L})([A-Za-z]{3})(?!\p{L})\s?(?=\d)|(?<=\d)\s?([A-Za-z]{3})(?!\p{L})/gu;
const AMOUNT_PATTERN = /(?<![\d.,])([-−])?(\d{1,3}(?:[.,'\s]\d{3})+|\d+)[.,](\d{2})(?!\d|[.,]\d)(?!\s?%)/gu;
const PARENTHESIZED_PATTERN = /\([^)]*\)/gu;
const INCLUSIVE_MARKER_PATTERN = buildReceiptKeywordPattern(Object.values(INCLUSIVE_MARKERS).flat(), 'iu');
const CASH_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(CASH_LABELS).flat(), 'iu');
const PAYMENT_PATTERN = buildReceiptKeywordPattern([...PAYMENT_BRANDS, ...Object.values(PAYMENT_LABELS).flat()], 'iu');
const TOTAL_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(TOTAL_LABELS).flat(), 'iu');
const EXCLUDED_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(EXCLUDED_LABELS).flat(), 'iu');

const findAmounts = (text: string): number[] =>
    [...text.matchAll(AMOUNT_PATTERN)]
        .filter(([, sign]) => !isDefined(sign))
        .map(([, , integerPart, fractionPart]) => convertToMicroUnits(Number(`${integerPart.replaceAll(/\D/gu, '')}.${fractionPart}`)))
        .filter(isPositiveNumber);

const findCurrencies = (text: string): CurrencyEnum[] =>
    [
        ...(text.match(CURRENCY_TOKEN_PATTERN) ?? []).map(token => CURRENCY_ALIASES.get(token.toLocaleLowerCase())),
        ...[...text.matchAll(CURRENCY_CODE_PATTERN)].map(([, before, after]) =>
            CURRENCY_CODES.get((isNotEmptyString(before) ? before : after).toUpperCase())
        )
    ].filter(isDefined);

const findMostFrequentCurrency = (rows: readonly string[]): CurrencyEnum | null => {
    const counts = rows
        .flatMap(findCurrencies)
        .reduce(
            (currencyCounts, currency) => currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1),
            new Map<CurrencyEnum, number>()
        );

    return [...counts.entries()].sort(([, left], [, right]) => right - left).at(0)?.[0] ?? null;
};

const findTotalCandidate = (
    rawRow: string,
    rowIndex: number
): { readonly amount: number; readonly row: string; readonly rowIndex: number } | null => {
    const row = rawRow.replaceAll(PARENTHESIZED_PATTERN, ' ');
    const marker = INCLUSIVE_MARKER_PATTERN.exec(row);
    const head = isDefined(marker) ? row.slice(0, marker.index) : row;
    const tail = isDefined(marker) ? row.slice(marker.index + marker[0].length) : '';
    const label = TOTAL_LABEL_PATTERN.exec(head);
    const cash = CASH_LABEL_PATTERN.exec(head);

    if (!isDefined(label) || EXCLUDED_LABEL_PATTERN.test(head) || (isDefined(cash) && cash.index < label.index)) {
        return null;
    }

    const amount = findAmounts(head.slice(label.index + label[0].length)).at(0) ?? findAmounts(tail).at(0);

    return isDefined(amount) ? { amount, row, rowIndex } : null;
};

export const extractReceiptTotal = (rows: readonly string[]): ReceiptTotalInterface | null => {
    const candidates = rows.map(findTotalCandidate).filter(isDefined);
    const paymentStart = rows.findIndex((row, index) => index >= (candidates.at(0)?.rowIndex ?? 0) && PAYMENT_PATTERN.test(row));
    const paymentRows = paymentStart < 0 ? [] : rows.slice(paymentStart);
    const paymentAmounts = new Set(paymentRows.flatMap(findAmounts));
    const confirmed = candidates.filter(candidate => paymentAmounts.has(candidate.amount));
    const best = [...(isNotEmptyArray(confirmed) ? confirmed : candidates)].sort((left, right) => right.amount - left.amount).at(0);

    if (!isDefined(best)) {
        return null;
    }

    return { amount: best.amount, currency: findCurrencies(best.row).at(0) ?? findMostFrequentCurrency(rows), paymentRows };
};
