import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import * as Result from 'effect/Result';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import type { PdfTextItemInterface } from '../../erste/interface/pdf-text-item.interface';
import type { InzhurHoldingInterface } from '../interface/inzhur-holding.interface';
import type { InzhurStatementInterface } from '../interface/inzhur-statement.interface';

const STATEMENT_TITLE = 'Виписка про стан рахунку в цінних паперах';
const ISSUER_MARKER = 'ІНЖУР';
const STATEMENT_DATE_REGEX = /(?<!\p{L})на\s+(\d{2})\.(\d{2})\.(\d{4})/u;
const ISIN_REGEX = /UA\d{10}/u;
const NOMINAL_REGEX = /^(\d[\d\s ]*,\d{2})\s*(?:\(UAH\))?\s*(.*)$/u;
const NUMBER_REGEX = /^\d[\d\s ]*(?:,\d+)?$/u;
const CODE_ONLY_REGEX = /^[\d\s \-–—]+$/u;
const STATUS_REGEX = /(?:^|;\s*)(?:Дійсний|Недійсний)/u;
const QUOTED_REGEX = /["“«„]([^"”»“]+)["”»“]/gu;
const Y_ROW_TOLERANCE = 3;
const MAX_NAME_LINES = 8;
const TOTAL_TOLERANCE = 0.01;
const ISIN_LENGTH = 12;

const compareByReadingOrder = (left: PdfTextItemInterface, right: PdfTextItemInterface): number => {
    if (left.page !== right.page) {
        return left.page - right.page;
    }

    const yDiff = right.y - left.y;

    return Math.abs(yDiff) > Y_ROW_TOLERANCE ? yDiff : left.x - right.x;
};

const groupRows = (items: readonly PdfTextItemInterface[]): PdfTextItemInterface[][] => {
    const groups: PdfTextItemInterface[][] = [];

    for (const item of [...items].sort(compareByReadingOrder)) {
        const last = groups.at(-1);
        const seed = last?.at(0);

        if (isDefined(last) && isDefined(seed) && seed.page === item.page && Math.abs(seed.y - item.y) <= Y_ROW_TOLERANCE) {
            last.push(item);
        } else {
            groups.push([item]);
        }
    }

    return groups.map(group => group.sort((left, right) => left.x - right.x));
};

const joinTexts = (items: readonly PdfTextItemInterface[]): string =>
    items
        .map(item => item.text.trim())
        .filter(isNotEmptyString)
        .join(' ')
        .replaceAll(/\s+/gu, ' ');

const parseNumber = (text: string): number => Number(text.replaceAll(/[\s ]/gu, '').replace(',', '.'));

const parseStatementDate = (lines: readonly string[]): Result.Result<string, string> => {
    const match = lines.map(line => STATEMENT_DATE_REGEX.exec(line)).find(isDefined);

    if (!isDefined(match)) {
        return Result.fail('Statement date not found');
    }

    const [, day, month, year] = match;

    return isValid(parse(`${day}.${month}.${year}`, 'dd.MM.yyyy', new Date()))
        ? Result.succeed(`${year}-${month}-${day}`)
        : Result.fail(`Invalid statement date: ${day}.${month}.${year}`);
};

const resolveFundName = (nameLines: readonly string[]): string => {
    const fullName = nameLines.join(' ');
    const lastQuoted = [...fullName.matchAll(QUOTED_REGEX)].at(-1)?.[1]?.trim();

    return isNotEmptyString(lastQuoted) ? lastQuoted : fullName;
};

const collectNameLines = (
    items: readonly PdfTextItemInterface[],
    anchor: PdfTextItemInterface,
    nextAnchor: PdfTextItemInterface | undefined
): string[] => {
    const lowerBound = isDefined(nextAnchor) && nextAnchor.page === anchor.page ? nextAnchor.y + Y_ROW_TOLERANCE : Number.NEGATIVE_INFINITY;
    const nameItems = items.filter(
        item =>
            item.page === anchor.page &&
            item.x < anchor.x &&
            item.y <= anchor.y + Y_ROW_TOLERANCE &&
            item.y > lowerBound &&
            !CODE_ONLY_REGEX.test(item.text)
    );
    const lines = groupRows(nameItems).map(joinTexts).filter(isNotEmptyString);
    const statusIndex = lines.findIndex(line => STATUS_REGEX.test(line));

    return lines.slice(0, statusIndex >= 0 ? statusIndex + 1 : MAX_NAME_LINES);
};

const parseQuantity = (tokens: readonly string[], isin: string): Result.Result<number, string> => {
    const nominalIndex = tokens.findIndex(token => NOMINAL_REGEX.test(token));
    const nominalMatch = nominalIndex >= 0 ? NOMINAL_REGEX.exec(tokens[nominalIndex]) : null;

    if (!isDefined(nominalMatch)) {
        return Result.fail(`Face value not found for ${isin}`);
    }

    const [, nominalText, remainder = ''] = nominalMatch;
    const [quantityText, totalText] = [remainder, ...tokens.slice(nominalIndex + 1)].map(token => token.trim()).filter(isNotEmptyString);

    if (!isDefined(quantityText) || !NUMBER_REGEX.test(quantityText)) {
        return Result.fail(`Quantity not found for ${isin}`);
    }

    const quantity = parseNumber(quantityText);
    const isTotalInconsistent =
        isDefined(totalText) &&
        NUMBER_REGEX.test(totalText) &&
        Math.abs(quantity * parseNumber(nominalText) - parseNumber(totalText)) > TOTAL_TOLERANCE;

    return isTotalInconsistent ? Result.fail(`Quantity does not match total face value for ${isin}`) : Result.succeed(quantity);
};

const parseHolding = (
    items: readonly PdfTextItemInterface[],
    anchor: PdfTextItemInterface,
    nextAnchor: PdfTextItemInterface | undefined
): Result.Result<InzhurHoldingInterface, string> => {
    const isin = ISIN_REGEX.exec(anchor.text)?.[0] ?? '';
    const rowItems = items
        .filter(item => item !== anchor && item.page === anchor.page && Math.abs(item.y - anchor.y) <= Y_ROW_TOLERANCE && item.x > anchor.x)
        .sort((left, right) => left.x - right.x);
    const tokens = [anchor.text.slice(anchor.text.indexOf(isin) + ISIN_LENGTH), ...rowItems.map(item => item.text)]
        .map(token => token.trim())
        .filter(isNotEmptyString);
    const quantity = parseQuantity(tokens, isin);

    return Result.isFailure(quantity)
        ? Result.fail(quantity.failure)
        : Result.succeed({ isin, name: resolveFundName(collectNameLines(items, anchor, nextAnchor)), quantity: quantity.success });
};

const mergeHoldings = (holdings: readonly InzhurHoldingInterface[]): InzhurHoldingInterface[] => {
    const holdingByIsin = new Map<string, InzhurHoldingInterface>();

    for (const holding of holdings) {
        const existing = holdingByIsin.get(holding.isin);

        holdingByIsin.set(holding.isin, isDefined(existing) ? { ...existing, quantity: existing.quantity + holding.quantity } : holding);
    }

    return [...holdingByIsin.values()];
};

const parseHoldings = (items: readonly PdfTextItemInterface[]): Result.Result<InzhurHoldingInterface[], string> => {
    const anchors = items.filter(item => ISIN_REGEX.test(item.text)).sort(compareByReadingOrder);
    const holdings: InzhurHoldingInterface[] = [];

    for (const [index, anchor] of anchors.entries()) {
        const holding = parseHolding(items, anchor, anchors.at(index + 1));

        if (Result.isFailure(holding)) {
            return Result.fail(holding.failure);
        }

        holdings.push(holding.success);
    }

    return Result.succeed(mergeHoldings(holdings));
};

export const parseInzhurStatement = (items: PdfTextItemInterface[]): Result.Result<InzhurStatementInterface, string> => {
    const lines = groupRows(items).map(joinTexts);
    const text = lines.join('\n');

    if (!text.includes(STATEMENT_TITLE) || !text.toUpperCase().includes(ISSUER_MARKER)) {
        return Result.fail('The document is not an Inzhur securities account statement');
    }

    const statementDate = parseStatementDate(lines);
    const holdings = parseHoldings(items);

    if (Result.isFailure(statementDate)) {
        return Result.fail(statementDate.failure);
    }

    return Result.isFailure(holdings)
        ? Result.fail(holdings.failure)
        : Result.succeed({ statementDate: statementDate.success, holdings: holdings.success });
};
