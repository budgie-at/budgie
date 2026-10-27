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
    [LanguageEnum.EN]: ['subtotal', 'sub total', 'tax', 'vat', 'tip', 'gratuity', 'change', 'tendered', 'cash', 'given'],
    [LanguageEnum.FR]: ['sous-total', 'tva', 'pourboire', 'rendu', 'espèces', 'donné'],
    [LanguageEnum.UK]: ['пдв', 'решта', 'готівка', 'готівкою'],
    [LanguageEnum.DE]: ['zwischensumme', 'ust', 'mwst', 'netto', 'trinkgeld', 'rückgeld', 'gegeben', 'bar', 'bargeld'],
    [LanguageEnum.ES]: ['subtotal', 'iva', 'propina', 'cambio', 'entregado', 'efectivo']
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
const CURRENCY_CODE_PATTERN = /(?<!\p{L})([A-Z]{3})(?!\p{L})\s?(?=\d)|(?<=\d)\s?([A-Z]{3})(?!\p{L})/gu;
const AMOUNT_PATTERN = /(?<![\d.,])([-−])?(\d{1,3}(?:[.,']\d{3})+|\d+)[.,](\d{2})(?!\d|[.,]\d)/gu;
const PARENTHESIZED_PATTERN = /\([^)]*\)/gu;
const INCLUSIVE_PHRASE_PATTERN = new RegExp(
    String.raw`${buildReceiptKeywordPattern(Object.values(INCLUSIVE_MARKERS).flat(), 'iu').source}\.?(?:\s+\p{L}+)?`,
    'giu'
);
const TOTAL_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(TOTAL_LABELS).flat(), 'iu');
const EXCLUDED_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(EXCLUDED_LABELS).flat(), 'iu');

const findAmounts = (text: string): number[] =>
    [...text.matchAll(AMOUNT_PATTERN)]
        .filter(([, sign]) => !isDefined(sign))
        .map(([, , integerPart, fractionPart]) => convertToMicroUnits(Number(`${integerPart.replaceAll(/\D/gu, '')}.${fractionPart}`)))
        .filter(isPositiveNumber);

const stripInclusivePhrases = (row: string): string => row.replaceAll(PARENTHESIZED_PATTERN, ' ').replaceAll(INCLUSIVE_PHRASE_PATTERN, ' ');

const findCurrencies = (text: string): CurrencyEnum[] =>
    [
        ...(text.match(CURRENCY_TOKEN_PATTERN) ?? []).map(token => CURRENCY_ALIASES.get(token.toLocaleLowerCase())),
        ...[...text.matchAll(CURRENCY_CODE_PATTERN)].map(([, before, after]) =>
            CURRENCY_CODES.get(isNotEmptyString(before) ? before : after)
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

export const hasReceiptTotalLabel = (row: string): boolean => TOTAL_LABEL_PATTERN.test(row);

export const extractReceiptTotal = (rows: readonly string[], paymentRows: readonly string[]): ReceiptTotalInterface | null => {
    const candidates = rows
        .map(row => stripInclusivePhrases(row))
        .filter(row => TOTAL_LABEL_PATTERN.test(row) && !EXCLUDED_LABEL_PATTERN.test(row))
        .flatMap(row =>
            findAmounts(row)
                .slice(-1)
                .map(amount => ({ amount, row }))
        );
    const paymentAmounts = new Set(paymentRows.flatMap(findAmounts));
    const confirmed = candidates.filter(candidate => paymentAmounts.has(candidate.amount));
    const best = [...(isNotEmptyArray(confirmed) ? confirmed : candidates)].sort((left, right) => right.amount - left.amount).at(0);

    if (!isDefined(best)) {
        return null;
    }

    return { amount: best.amount, currency: findCurrencies(best.row).at(0) ?? findMostFrequentCurrency(rows) };
};
