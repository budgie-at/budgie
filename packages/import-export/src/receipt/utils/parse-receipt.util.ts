import { LanguageEnum } from '@budgie/contracts';
import { format } from 'date-fns';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { buildReceiptKeywordPattern } from './build-receipt-keyword-pattern.util';
import { extractReceiptMerchant } from './extract-receipt-merchant.util';
import { extractReceiptTimestamp } from './extract-receipt-timestamp.util';
import { extractReceiptTotal } from './extract-receipt-total.util';

import type { ReceiptDraftInterface } from '../interface/receipt-draft.interface';
import type { ReceiptTextLineInterface } from '../interface/receipt-text-line.interface';
import type { ReceiptTimestampInterface } from '../interface/receipt-timestamp.interface';

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
