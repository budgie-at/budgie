import { LanguageEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildReceiptKeywordPattern } from './build-receipt-keyword-pattern.util';

import type { ReceiptMerchantInterface } from '../interface/receipt-merchant.interface';
import type { ReceiptTextLineInterface } from '../interface/receipt-text-line.interface';

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

export const extractReceiptMerchant = (
    lines: readonly ReceiptTextLineInterface[],
    rows: readonly string[],
    vatRowIndex: number
): ReceiptMerchantInterface => {
    const legalName = findLegalName(rows, vatRowIndex);

    return { candidates: [...new Set([...findTopCandidates(lines), legalName].filter(isDefined))], legalName };
};
