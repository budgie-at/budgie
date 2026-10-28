/* eslint-disable max-lines -- approved by Vitalii Yehorov: receipt parsing is one cohesive pipeline */
import { convertToMicroUnits, CurrencyEnum, LanguageEnum } from '@budgie/contracts';
import { format } from 'date-fns';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import type { ReceiptDraftInterface } from '../interface/receipt-draft.interface';
import type { ReceiptTextLineInterface } from '../interface/receipt-text-line.interface';
import type { ReceiptTimestampInterface } from '../interface/receipt-timestamp.interface';
import type { ReceiptTotalCandidateInterface } from '../interface/receipt-total-candidate.interface';

const buildReceiptKeywordPattern = (keywords: readonly string[], flags: string): RegExp => {
    const alternation = [...keywords]
        .sort((left, right) => right.length - left.length)
        .map(keyword => keyword.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&').replaceAll(' ', String.raw`[\s.,-]+`))
        .join('|');

    return new RegExp(String.raw`(?<!\p{L})(?:${alternation})(?!\p{L})`, flags);
};

const TOTAL_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['total', 'amount', 'due'],
    [LanguageEnum.FR]: ['total', 'montant', 'à payer'],
    [LanguageEnum.UK]: ['сума', 'разом', 'до сплати', 'всього'],
    [LanguageEnum.DE]: ['gesamt', 'summe', 'gesamtbetrag', 'betrag', 'zu zahlen', 'endsumme'],
    [LanguageEnum.ES]: ['total', 'importe', 'a pagar']
};

const CHANGE_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['change'],
    [LanguageEnum.FR]: ['rendu'],
    [LanguageEnum.UK]: ['решта'],
    [LanguageEnum.DE]: ['rückgeld'],
    [LanguageEnum.ES]: ['cambio']
};

const ROUNDING_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['rounding', 'round off'],
    [LanguageEnum.FR]: ['arrondi'],
    [LanguageEnum.UK]: ['заокруглення'],
    [LanguageEnum.DE]: ['rundung'],
    [LanguageEnum.ES]: ['redondeo']
};

const EXCLUDED_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: [
        'subtotal',
        'sub total',
        'tax',
        'vat',
        'gst',
        'tip',
        'gratuity',
        'tendered',
        'given',
        'paid',
        'qty',
        'quantity',
        'excl',
        'excluding',
        'discount',
        'saving',
        'savings'
    ],
    [LanguageEnum.FR]: ['sous-total', 'tva', 'pourboire', 'donné', 'hors taxes', 'remise'],
    [LanguageEnum.UK]: ['пдв', 'знижка'],
    [LanguageEnum.DE]: ['zwischensumme', 'ust', 'mwst', 'netto', 'trinkgeld', 'gegeben', 'rabatt'],
    [LanguageEnum.ES]: ['subtotal', 'iva', 'propina', 'entregado', 'descuento']
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
    [LanguageEnum.EN]: ['inc', 'incl', 'includes', 'including', 'included', 'inclusive'],
    [LanguageEnum.FR]: ['incl', 'inclus', 'dont'],
    [LanguageEnum.UK]: ['включно', 'в т.ч'],
    [LanguageEnum.DE]: ['inkl', 'einschl', 'davon'],
    [LanguageEnum.ES]: ['incl', 'incluido', 'incluye']
};

const CURRENCY_SYMBOLS: readonly (readonly [string, CurrencyEnum])[] = [
    ['€', CurrencyEnum.EUR],
    ['$', CurrencyEnum.USD],
    ['£', CurrencyEnum.GBP],
    ['₴', CurrencyEnum.UAH],
    ['rm', CurrencyEnum.MYR],
    ['rp', CurrencyEnum.IDR],
    ['kč', CurrencyEnum.CZK]
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
const CURRENCY_CODE_PATTERN = /(?<!\p{L})([A-Za-z]{3})(?!\p{L})\s*(?=\d)|(?<=\d)\s*([A-Za-z]{3})(?!\p{L})/gu;
const AMOUNT_PATTERN = /(?<![\d.,])([-−])?(\d{1,3}(?:[.,'\p{Zs}]\d{3})+|\d+)[.,](\d{2})(?!\d|[.,]\d)(?!\s?%)/gu;
const GROUPED_INTEGER_PATTERN = /(?<!\d[.,]?)([-−])?([1-9]\d{0,2}([.,])\d{3}(?:\3\d{3})*)(?![\d.,]|\s?%)/gu;
const ZERO_MINOR_UNIT_CURRENCIES: ReadonlySet<CurrencyEnum> = new Set([
    CurrencyEnum.BIF,
    CurrencyEnum.CLP,
    CurrencyEnum.DJF,
    CurrencyEnum.GNF,
    CurrencyEnum.HUF,
    CurrencyEnum.IDR,
    CurrencyEnum.ISK,
    CurrencyEnum.JPY,
    CurrencyEnum.KRW,
    CurrencyEnum.PYG,
    CurrencyEnum.UGX,
    CurrencyEnum.VND,
    CurrencyEnum.XAF,
    CurrencyEnum.XOF
]);
const PARENTHESIZED_PATTERN = /\([^()]*\)/gu;
const INCLUSIVE_MARKER_PATTERN = buildReceiptKeywordPattern(Object.values(INCLUSIVE_MARKERS).flat(), 'iu');
const CASH_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(CASH_LABELS).flat(), 'iu');
const PAYMENT_PATTERN = buildReceiptKeywordPattern([...PAYMENT_BRANDS, ...Object.values(PAYMENT_LABELS).flat()], 'iu');
const TOTAL_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(TOTAL_LABELS).flat(), 'iu');
const CHANGE_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(CHANGE_LABELS).flat(), 'iu');
const ROUNDING_LABEL_PATTERN = buildReceiptKeywordPattern(Object.values(ROUNDING_LABELS).flat(), 'iu');
const EXCLUDED_LABEL_PATTERN = buildReceiptKeywordPattern(
    [...Object.values(EXCLUDED_LABELS), ...Object.values(CHANGE_LABELS)].flat(),
    'iu'
);
const OTHER_LABEL_PATTERN = new RegExp(`${EXCLUDED_LABEL_PATTERN.source}|${CASH_LABEL_PATTERN.source}`, 'iu');
const PERCENT_PATTERN = /\d\s?%/u;
const SIGNED_DIGIT_PATTERN = /[-−]?\d/u;

const findSignedAmounts = (text: string): number[] =>
    [...text.matchAll(AMOUNT_PATTERN)].map(
        ([, sign, integer = '', fraction = '']) =>
            (isDefined(sign) ? -1 : 1) * convertToMicroUnits(Number(`${integer.replaceAll(/\D/gu, '')}.${fraction}`))
    );

const expandGroupedIntegers = (row: string): string =>
    row.search(AMOUNT_PATTERN) < 0 ? row.replaceAll(GROUPED_INTEGER_PATTERN, ' $1$2.00') : row;

const findAmounts = (text: string): number[] => findSignedAmounts(text).filter(isPositiveNumber);

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

const findLabelAmount = (head: string, tail: string, label: RegExpExecArray): number | null => {
    const valueStart = label.index + label[0].length;
    const values = head.slice(valueStart);
    const firstDigit = Math.max(values.search(SIGNED_DIGIT_PATTERN), 0);
    const labelZone = head.slice(0, valueStart + firstDigit);
    const amountZone = values.slice(firstDigit);
    const cash = CASH_LABEL_PATTERN.exec(labelZone);
    const nextLabel = amountZone.search(OTHER_LABEL_PATTERN);

    if (EXCLUDED_LABEL_PATTERN.test(labelZone) || PERCENT_PATTERN.test(values) || (isDefined(cash) && cash.index < label.index)) {
        return null;
    }

    return findAmounts(nextLabel < 0 ? amountZone : amountZone.slice(0, nextLabel)).at(-1) ?? findAmounts(tail).at(0) ?? null;
};

const findTotalCandidate = (rawRow: string, rowIndex: number): ReceiptTotalCandidateInterface | null => {
    const row = rawRow.replaceAll(PARENTHESIZED_PATTERN, group => (INCLUSIVE_MARKER_PATTERN.test(group) ? ' ' : group));
    const marker = INCLUSIVE_MARKER_PATTERN.exec(row);
    const head = isDefined(marker) ? row.slice(0, marker.index) : row;
    const tail = isDefined(marker) ? row.slice(marker.index + marker[0].length) : '';
    const label = TOTAL_LABEL_PATTERN.exec(head);
    const amount = isDefined(label) ? findLabelAmount(head, tail, label) : null;

    return isDefined(amount) ? { amount, row, rowIndex } : null;
};

const findLastLabelledAmount = (rows: readonly string[], pattern: RegExp): number | null =>
    rows
        .filter(row => pattern.test(row))
        .map(row => findSignedAmounts(row).at(-1))
        .filter(isDefined)
        .at(-1) ?? null;

const findTenderedTotal = (rows: readonly string[]): number | null => {
    const cash = findLastLabelledAmount(
        rows.filter(row => !TOTAL_LABEL_PATTERN.test(row)),
        CASH_LABEL_PATTERN
    );
    const change = findLastLabelledAmount(rows, CHANGE_LABEL_PATTERN);

    return isDefined(cash) && isDefined(change) && change >= 0 && cash > change ? cash - change : null;
};

const resolveTotal = (
    rows: readonly string[],
    candidates: readonly ReceiptTotalCandidateInterface[],
    evidence: ReadonlySet<number | null>
): ReceiptTotalCandidateInterface | null => {
    const confirmed = candidates.filter(candidate => evidence.has(candidate.amount));
    const pool = isNotEmptyArray(confirmed) ? confirmed : candidates;
    const roundingIndex = rows.findLastIndex(row => ROUNDING_LABEL_PATTERN.test(row) && !TOTAL_LABEL_PATTERN.test(row));
    const rounded = pool.filter(candidate => candidate.rowIndex > roundingIndex);
    const best = [...(isNotEmptyArray(rounded) ? rounded : pool)].sort((left, right) => right.amount - left.amount).at(0);
    const adjustment = isDefined(best) && roundingIndex > best.rowIndex ? (findSignedAmounts(rows.at(roundingIndex) ?? '').at(-1) ?? 0) : 0;

    if (!isDefined(best) || (adjustment !== 0 && !evidence.has(best.amount + adjustment))) {
        return null;
    }

    return { ...best, amount: best.amount + adjustment };
};

const extractReceiptTotal = (rows: readonly string[], receiptCurrency: CurrencyEnum) => {
    const candidates = rows.map(findTotalCandidate).filter(isDefined);
    const paymentStart = rows.findIndex((row, index) => index >= (candidates.at(0)?.rowIndex ?? 0) && PAYMENT_PATTERN.test(row));
    const paymentRows = paymentStart < 0 ? [] : rows.slice(paymentStart);
    const tendered = findTenderedTotal(rows);
    const total = resolveTotal(
        rows,
        candidates,
        new Set([...paymentRows.filter(row => PAYMENT_PATTERN.test(row)).flatMap(findAmounts), tendered])
    );

    if (!isDefined(total) || (isDefined(tendered) && tendered !== total.amount)) {
        return null;
    }

    return { amount: total.amount, currency: findCurrencies(total.row).at(0) ?? receiptCurrency, paymentRows };
};

const MONTH_NAMES: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    [LanguageEnum.FR]: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
    [LanguageEnum.UK]: ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'],
    [LanguageEnum.DE]: ['jan', 'feb', 'mär', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'],
    [LanguageEnum.ES]: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
};

const MONTH_PREFIXES = Object.values(MONTH_NAMES).flatMap(names => names.map((name, index) => ({ name, month: index + 1 })));
const ISO_DATE_PATTERN = /(?<![\p{L}\d]|\d[./-])(\d{4})([-/.])(\d{1,2})\2(\d{1,2})(?![\p{L}\d]|[./-]\d)/u;
const DAY_FIRST_DATE_PATTERN = /(?<![\p{L}\d]|\d[./-])(\d{1,2})([./-])(\d{1,2})\2(\d{4}|\d{2})(?![\p{L}\d]|[./-]\d)/u;
const DAY_MONTH_NAME_DATE_PATTERN = /(?<![\p{L}\d])(\d{1,2})\.?[\s-]?(\p{L}{3,})\.?,?[\s-]?(\d{4}|\d{2})(?![\d:])/u;
const MONTH_NAME_DAY_DATE_PATTERN = /(?<![\p{L}\d])(\p{L}{3,})\.?\s?(\d{1,2}),?\s(\d{4})(?!\d)/u;
const TIME_PATTERN = /(?<![\d:])([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s?([AaPp])\.?[Mm]\.?)?(?![\d:])/u;
const MONTHS_IN_YEAR = 12;
const HOURS_IN_HALF_DAY = 12;
const TWO_DIGIT_YEAR_LIMIT = 100;
const TWO_DIGIT_YEAR_BASE = 2000;
const FULL_YEAR_LENGTH = 4;

const buildDate = (year: number, month: number, day: number): Date | null => {
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

const toFullYear = (rawYear: number): number => (rawYear < TWO_DIGIT_YEAR_LIMIT ? rawYear + TWO_DIGIT_YEAR_BASE : rawYear);

const findMonthNameDate = (text: string): Date | null => {
    const dayFirst = DAY_MONTH_NAME_DATE_PATTERN.exec(text);
    const monthFirst = MONTH_NAME_DAY_DATE_PATTERN.exec(text);
    const parts = isDefined(dayFirst) ? [dayFirst[1], dayFirst[2], dayFirst[3]] : [monthFirst?.[2], monthFirst?.[1], monthFirst?.[3]];
    const [day, monthName = '', year] = parts;
    const month = MONTH_PREFIXES.find(({ name }) => monthName.toLocaleLowerCase().startsWith(name))?.month;

    return isDefined(day) && isDefined(year) && isDefined(month) ? buildDate(toFullYear(Number(year)), month, Number(day)) : null;
};

const findDate = (text: string): Date | null => {
    const isoMatch = ISO_DATE_PATTERN.exec(text);

    if (isDefined(isoMatch)) {
        return buildDate(Number(isoMatch[1]), Number(isoMatch[3]), Number(isoMatch[4]));
    }

    const dayFirstMatch = DAY_FIRST_DATE_PATTERN.exec(text);

    if (!isDefined(dayFirstMatch)) {
        return findMonthNameDate(text);
    }

    const [, first, separator, second, rawYear] = dayFirstMatch;
    const year = toFullYear(Number(rawYear));
    const isMonthFirst = Number(second) > MONTHS_IN_YEAR && (separator === '/' || rawYear.length === FULL_YEAR_LENGTH);

    return isMonthFirst ? buildDate(year, Number(first), Number(second)) : buildDate(year, Number(second), Number(first));
};

const toHour = (hours: string, meridiem: string): number => {
    if (!isNotEmptyString(meridiem)) {
        return Number(hours);
    }

    return (Number(hours) % HOURS_IN_HALF_DAY) + (meridiem.toUpperCase() === 'P' ? HOURS_IN_HALF_DAY : 0);
};

const withTime = (date: Date, text: string): Date | null => {
    const timeMatch = TIME_PATTERN.exec(text);

    if (!isDefined(timeMatch)) {
        return null;
    }

    const [, hours, minutes, seconds, meridiem] = timeMatch;

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        toHour(hours, meridiem),
        Number(minutes),
        isNotEmptyString(seconds) ? Number(seconds) : 0
    );
};

const findTimestamp = (text: string, nextText: string | undefined): ReceiptTimestampInterface | null => {
    const date = findDate(text);

    if (!isDefined(date)) {
        return null;
    }

    const followingTime = isDefined(nextText) && !isDefined(findDate(nextText)) ? withTime(date, nextText) : null;
    const dateTime = withTime(date, text) ?? followingTime;

    return isDefined(dateTime) ? { occurredAt: dateTime, hasTime: true } : { occurredAt: date, hasTime: false };
};

const extractReceiptTimestamp = (rows: readonly string[], paymentRows: readonly string[]): ReceiptTimestampInterface | null =>
    [paymentRows, rows].flatMap(source => source.map((text, index) => findTimestamp(text, source[index + 1]))).find(isDefined) ?? null;

const LEGAL_FORMS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['Ltd', 'LLC', 'Inc', 'Corp', 'PLC'],
    [LanguageEnum.FR]: ['SARL', 'SAS', 'SA', 'EURL'],
    [LanguageEnum.UK]: ['ТОВ', 'ФОП', 'ПП', 'ПрАТ', 'АТ'],
    [LanguageEnum.DE]: ['GmbH', 'GesbR', 'GesmbH', 'AG', 'KG', 'OG', 'OHG', 'e.U.'],
    [LanguageEnum.ES]: ['S.L.', 'S.A.', 'SL']
};

const LEGAL_FORM_PATTERN = buildReceiptKeywordPattern(Object.values(LEGAL_FORMS).flat(), 'u');
const MERCHANT_TEXT_PATTERN = /\p{L}{2}/u;
const NUMERIC_RUN_PATTERN = /\d{3}/u;
const TOP_BAND_RATIO = 0.2;
const MAX_TOP_CANDIDATES = 3;

const findTopCandidates = (lines: readonly ReceiptTextLineInterface[]): string[] => {
    const top = Math.min(...lines.map(line => line.y));
    const bottom = Math.max(...lines.map(line => line.y + line.height));
    const bandBottom = top + (bottom - top) * TOP_BAND_RATIO;

    return lines
        .filter(line => line.y < bandBottom && MERCHANT_TEXT_PATTERN.test(line.text) && !NUMERIC_RUN_PATTERN.test(line.text))
        .sort((left, right) => right.height - left.height)
        .map(line => line.text.trim())
        .slice(0, MAX_TOP_CANDIDATES);
};

const findLegalName = (rows: readonly string[], vatRowIndex: number): string | null => {
    const anchorIndex = Math.max(vatRowIndex, 0);

    return (
        rows
            .map((row, index) => ({ row, distance: Math.abs(index - anchorIndex) }))
            .filter(({ row }) => LEGAL_FORM_PATTERN.test(row))
            .sort((left, right) => left.distance - right.distance)
            .at(0)?.row ?? null
    );
};

const RECEIPT_NUMBER_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['invoice no', 'invoice', 'receipt no', 'receipt', 'check', 'order no'],
    [LanguageEnum.FR]: ['facture', 'ticket', 'reçu'],
    [LanguageEnum.UK]: ['чек', 'номер чека'],
    [LanguageEnum.DE]: [
        'rechnungsnr',
        'rechnungsnummer',
        'rechnung nr',
        'beleg-nr',
        'belegnr',
        'beleg nr',
        'bon-nr',
        'bonnr',
        'bon nr',
        'bon'
    ],
    [LanguageEnum.ES]: ['factura', 'ticket', 'recibo']
};

const RECEIPT_NUMBER_PATTERN = new RegExp(
    String.raw`${buildReceiptKeywordPattern(Object.values(RECEIPT_NUMBER_LABELS).flat(), 'iu').source}[\s.:#№°º-]*([\p{L}\d][\p{L}\d/-]*\d[\p{L}\d/-]*)`,
    'iu'
);
const CARD_PATTERN = /(?:[*X•x]{4}[\s-]*){1,4}(\d{4})(?!\d)/u;
const VAT_ID_PATTERNS: readonly RegExp[] = [
    /(?<!\p{L})(ATU\s?\d{8})(?!\d)/u,
    /(?<!\p{L})(DE\s?\d{9})(?!\d)/u,
    /(?<!\p{L})((?:BE|BG|CY|CZ|DK|EE|EL|ES|FI|FR|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK)\s?(?=[\dA-Z]*\d{7})[\dA-Z]{8,12})(?![\dA-Z])/u,
    /(?<!\p{L})(?:ІПН|ПН|ЄДРПОУ|ЕДРПОУ)\s*[:№]?\s*(\d{12}|\d{10}|\d{8})(?!\d)/iu
];

const SAME_ROW_TOLERANCE = 0.75;

const isSameRow = (anchor: ReceiptTextLineInterface, line: ReceiptTextLineInterface): boolean =>
    Math.abs(anchor.y + anchor.height / 2 - (line.y + line.height / 2)) <= Math.min(anchor.height, line.height) * SAME_ROW_TOLERANCE;

const groupRows = (lines: readonly ReceiptTextLineInterface[]): string[] =>
    [...lines]
        .sort((left, right) => left.y - right.y)
        .reduce<ReceiptTextLineInterface[][]>((rows, line) => {
            const currentRow = rows.at(-1);

            if (isDefined(currentRow) && isSameRow(currentRow[0], line)) {
                currentRow.push(line);
            } else {
                rows.push([line]);
            }

            return rows;
        }, [])
        .map(row =>
            [...row]
                .sort((left, right) => left.x - right.x)
                .map(line => line.text.trim())
                .join('  ')
        );

const findReceiptNumber = (rows: readonly string[]): string | null =>
    rows
        .map(row => RECEIPT_NUMBER_PATTERN.exec(row)?.[1])
        .filter(isDefined)
        .find(candidate => !isDefined(findDate(candidate))) ?? null;

const findVatId = (row: string): string | null =>
    VAT_ID_PATTERNS.map(pattern => pattern.exec(row)?.[1])
        .find(isDefined)
        ?.replaceAll(/\s/gu, '') ?? null;

const buildFingerprint = (draft: Omit<ReceiptDraftInterface, 'fingerprint'>, timestamp: ReceiptTimestampInterface | null): string => {
    const date = isDefined(timestamp) ? format(timestamp.occurredAt, 'yyyy-MM-dd') : '';

    if (isNotEmptyString(draft.merchantVatId) && isNotEmptyString(draft.receiptNumber)) {
        return [draft.merchantVatId, draft.receiptNumber, draft.total, date].join('|');
    }

    const time = isDefined(timestamp) && timestamp.hasTime ? format(timestamp.occurredAt, 'HH:mm') : '';
    const merchant = (draft.merchantCandidates.at(0) ?? '').toLocaleLowerCase().replaceAll(/[^\p{L}\p{N}]+/gu, '');

    return [merchant, draft.total, date, time, draft.receiptNumber].filter(isDefined).join('|');
};

export const parseReceipt = (lines: readonly ReceiptTextLineInterface[], defaultCurrency: CurrencyEnum): ReceiptDraftInterface | null => {
    const rows = groupRows(lines);
    const receiptCurrency = findMostFrequentCurrency(rows) ?? defaultCurrency;
    const total = extractReceiptTotal(
        ZERO_MINOR_UNIT_CURRENCIES.has(receiptCurrency) ? rows.map(expandGroupedIntegers) : rows,
        receiptCurrency
    );

    if (!isDefined(total)) {
        return null;
    }

    const timestamp = extractReceiptTimestamp(rows, total.paymentRows);
    const vatIds = rows.map(findVatId);
    const merchantLegalName = findLegalName(rows, vatIds.findIndex(isDefined));
    const draft = {
        total: total.amount,
        currency: total.currency,
        occurredAt: timestamp?.occurredAt ?? null,
        cardLast4: rows.map(row => CARD_PATTERN.exec(row)?.[1]).find(isDefined) ?? null,
        receiptNumber: findReceiptNumber(rows),
        merchantVatId: vatIds.find(isDefined) ?? null,
        merchantLegalName,
        merchantCandidates: [...new Set([...findTopCandidates(lines), merchantLegalName].filter(isDefined))]
    };

    return { ...draft, fingerprint: buildFingerprint(draft, timestamp) };
};
