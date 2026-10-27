/* oxlint-disable max-lines -- approved by Vitalii Yehorov: receipt parsing is one cohesive pipeline */
import { convertToMicroUnits, CurrencyEnum, LanguageEnum } from '@budgie/contracts';
import { format } from 'date-fns';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import type { ReceiptDraftInterface } from '../interface/receipt-draft.interface';
import type { ReceiptTextLineInterface } from '../interface/receipt-text-line.interface';
import type { ReceiptTimestampInterface } from '../interface/receipt-timestamp.interface';

const buildReceiptKeywordPattern = (keywords: readonly string[], flags: string): RegExp => {
    const alternation = [...keywords]
        .sort((left, right) => right.length - left.length)
        .map(keyword => keyword.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
        .join('|');

    return new RegExp(String.raw`(?<!\p{L})(?:${alternation})(?!\p{L})`, flags);
};

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

const extractReceiptTotal = (rows: readonly string[]) => {
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

const ISO_DATE_PATTERN = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/u;
const DAY_FIRST_DATE_PATTERN = /(?<!\d)(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})(?!\d)/u;
const TIME_PATTERN = /(?<![\d:])([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s?([AaPp])\.?[Mm]\.?)?(?![\d:])/u;
const MONTHS_IN_YEAR = 12;
const HOURS_IN_HALF_DAY = 12;
const TWO_DIGIT_YEAR_LIMIT = 100;
const TWO_DIGIT_YEAR_BASE = 2000;

const buildDate = (year: number, month: number, day: number): Date | null => {
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

const findDate = (text: string): Date | null => {
    const isoMatch = ISO_DATE_PATTERN.exec(text);

    if (isDefined(isoMatch)) {
        return buildDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const dayFirstMatch = DAY_FIRST_DATE_PATTERN.exec(text);

    if (!isDefined(dayFirstMatch)) {
        return null;
    }

    const [, first, second, rawYear] = dayFirstMatch.map(Number);
    const year = rawYear < TWO_DIGIT_YEAR_LIMIT ? rawYear + TWO_DIGIT_YEAR_BASE : rawYear;

    return second > MONTHS_IN_YEAR ? buildDate(year, first, second) : buildDate(year, second, first);
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

const extractReceiptMerchant = (lines: readonly ReceiptTextLineInterface[], rows: readonly string[], vatRowIndex: number) => {
    const legalName = findLegalName(rows, vatRowIndex);

    return { candidates: [...new Set([...findTopCandidates(lines), legalName].filter(isDefined))], legalName };
};

const RECEIPT_NUMBER_LABELS: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['invoice no', 'invoice', 'receipt no', 'receipt', 'check', 'order no'],
    [LanguageEnum.FR]: ['facture', 'ticket', 'reçu'],
    [LanguageEnum.UK]: ['чек', 'номер чека'],
    [LanguageEnum.DE]: ['rechnungsnr', 'rechnungsnummer', 'beleg-nr', 'belegnr', 'bon-nr', 'bonnr', 'bon'],
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
const DATE_LIKE_PATTERN = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/u;

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
                .join(' ')
        );

const findReceiptNumber = (rows: readonly string[]): string | null =>
    rows
        .map(row => RECEIPT_NUMBER_PATTERN.exec(row)?.[1])
        .filter(isDefined)
        .find(candidate => !DATE_LIKE_PATTERN.test(candidate)) ?? null;

const findFirstCapture = (rows: readonly string[], pattern: RegExp): string | null =>
    rows.map(row => pattern.exec(row)?.[1]).find(isDefined) ?? null;

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

    return [merchant, draft.total, date, time].join('|');
};

export const parseReceipt = (lines: readonly ReceiptTextLineInterface[]): ReceiptDraftInterface | null => {
    const rows = groupRows(lines);
    const total = extractReceiptTotal(rows);

    if (!isDefined(total)) {
        return null;
    }

    const timestamp = extractReceiptTimestamp(rows, total.paymentRows);
    const vatIds = rows.map(findVatId);
    const merchant = extractReceiptMerchant(lines, rows, vatIds.findIndex(isDefined));
    const draft = {
        total: total.amount,
        currency: total.currency,
        occurredAt: timestamp?.occurredAt ?? null,
        cardLast4: findFirstCapture(rows, CARD_PATTERN),
        receiptNumber: findReceiptNumber(rows),
        merchantVatId: vatIds.find(isDefined) ?? null,
        merchantLegalName: merchant.legalName,
        merchantCandidates: merchant.candidates
    };

    return { ...draft, fingerprint: buildFingerprint(draft, timestamp) };
};
