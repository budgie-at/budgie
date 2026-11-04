import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import * as Result from 'effect/Result';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { PdfTextItemInterface } from '../../erste/interface/pdf-text-item.interface';
import type { InzhurHoldingInterface } from '../interface/inzhur-holding.interface';
import type { InzhurStatementInterface } from '../interface/inzhur-statement.interface';

class InzhurStatementParser {
    private static readonly STATEMENT_TITLE = 'Виписка про стан рахунку в цінних паперах';
    private static readonly ISSUER_MARKER = 'ІНЖУР';
    private static readonly STATEMENT_DATE_REGEX = /(?<!\p{L})на\s+(\d{2})\.(\d{2})\.(\d{4})/u;
    private static readonly ISIN_REGEX = /UA\d{10}/u;
    private static readonly NOMINAL_REGEX = /^(\d[\d\s ]*,\d{2})\s*(?:\(UAH\))?\s*(.*)$/u;
    private static readonly NUMBER_REGEX = /^\d[\d\s ]*(?:,\d+)?$/u;
    private static readonly CODE_ONLY_REGEX = /^[\d\s \-–—]+$/u;
    private static readonly STATUS_REGEX = /(?:^|;\s*)(?:Дійсний|Недійсний)/u;
    private static readonly QUOTED_REGEX = /["“«„]([^"”»“]+)["”»“]/gu;
    private static readonly Y_ROW_TOLERANCE = 3;
    private static readonly MAX_NAME_LINES = 8;
    private static readonly NAME_LINE_HEIGHT = 20;
    private static readonly TOTAL_TOLERANCE = 0.01;
    private static readonly ISIN_LENGTH = 12;

    parse(items: readonly PdfTextItemInterface[]): Result.Result<InzhurStatementInterface, string> {
        const lines = this.groupRows(items).map(row => this.joinTexts(row));
        const text = lines.join('\n');

        if (!text.includes(InzhurStatementParser.STATEMENT_TITLE) || !text.toUpperCase().includes(InzhurStatementParser.ISSUER_MARKER)) {
            return Result.fail('The document is not an Inzhur securities account statement');
        }

        const statementDate = this.parseStatementDate(lines);
        const holdings = this.parseHoldings(items);

        if (Result.isFailure(statementDate)) {
            return Result.fail(statementDate.failure);
        }

        return Result.isFailure(holdings)
            ? Result.fail(holdings.failure)
            : Result.succeed({ statementDate: statementDate.success, holdings: holdings.success });
    }

    private compareByReadingOrder(left: PdfTextItemInterface, right: PdfTextItemInterface): number {
        if (left.page !== right.page) {
            return left.page - right.page;
        }

        const yDiff = right.y - left.y;

        return Math.abs(yDiff) > InzhurStatementParser.Y_ROW_TOLERANCE ? yDiff : left.x - right.x;
    }

    private groupRows(items: readonly PdfTextItemInterface[]): PdfTextItemInterface[][] {
        const groups: PdfTextItemInterface[][] = [];

        for (const item of [...items].sort((left, right) => this.compareByReadingOrder(left, right))) {
            const last = groups.at(-1);
            const seed = last?.at(0);

            if (
                isDefined(last) &&
                isDefined(seed) &&
                seed.page === item.page &&
                Math.abs(seed.y - item.y) <= InzhurStatementParser.Y_ROW_TOLERANCE
            ) {
                last.push(item);
            } else {
                groups.push([item]);
            }
        }

        return groups.map(group => group.sort((left, right) => left.x - right.x));
    }

    private joinTexts(items: readonly PdfTextItemInterface[]): string {
        return items
            .map(item => item.text.trim())
            .filter(isNotEmptyString)
            .join(' ')
            .replaceAll(/\s+/gu, ' ');
    }

    private parseNumber(text: string): number {
        return Number(text.replaceAll(/[\s ]/gu, '').replace(',', '.'));
    }

    private parseStatementDate(lines: readonly string[]): Result.Result<string, string> {
        const match = lines.map(line => InzhurStatementParser.STATEMENT_DATE_REGEX.exec(line)).find(isDefined);

        if (!isDefined(match)) {
            return Result.fail('Statement date not found');
        }

        const [, day, month, year] = match;

        return isValid(parse(`${day}.${month}.${year}`, 'dd.MM.yyyy', new Date()))
            ? Result.succeed(`${year}-${month}-${day}`)
            : Result.fail(`Invalid statement date: ${day}.${month}.${year}`);
    }

    private collectNameLines(
        items: readonly PdfTextItemInterface[],
        anchor: PdfTextItemInterface,
        nextAnchor: PdfTextItemInterface | undefined
    ): string[] {
        const { Y_ROW_TOLERANCE, MAX_NAME_LINES, NAME_LINE_HEIGHT, CODE_ONLY_REGEX, STATUS_REGEX } = InzhurStatementParser;
        const nextAnchorBound =
            isDefined(nextAnchor) && nextAnchor.page === anchor.page ? nextAnchor.y + Y_ROW_TOLERANCE : Number.NEGATIVE_INFINITY;
        const lowerBound = Math.max(nextAnchorBound, anchor.y - MAX_NAME_LINES * NAME_LINE_HEIGHT);
        const nameItems = items.filter(
            item =>
                item.page === anchor.page &&
                item.x < anchor.x &&
                item.y <= anchor.y + Y_ROW_TOLERANCE &&
                item.y > lowerBound &&
                !CODE_ONLY_REGEX.test(item.text)
        );
        const lines = this.groupRows(nameItems)
            .map(row => this.joinTexts(row))
            .filter(isNotEmptyString);
        const statusIndex = lines.findIndex(line => STATUS_REGEX.test(line));

        return statusIndex >= 0 ? lines.slice(0, statusIndex + 1) : [];
    }

    private resolveFundName(nameLines: readonly string[], isin: string): string {
        const lastQuoted = [...nameLines.join(' ').matchAll(InzhurStatementParser.QUOTED_REGEX)].at(-1)?.[1]?.trim();

        return isNotEmptyString(lastQuoted) ? lastQuoted : isin;
    }

    private parseQuantity(tokens: readonly string[], isin: string): Result.Result<number, string> {
        const { NOMINAL_REGEX, NUMBER_REGEX, TOTAL_TOLERANCE } = InzhurStatementParser;
        const nominalIndex = tokens.findIndex(token => NOMINAL_REGEX.test(token));
        const nominalMatch = nominalIndex >= 0 ? NOMINAL_REGEX.exec(tokens[nominalIndex]) : null;

        if (!isDefined(nominalMatch)) {
            return Result.fail(`Face value not found for ${isin}`);
        }

        const [, nominalText, remainder = ''] = nominalMatch;
        const [quantityText, totalText] = [remainder, ...tokens.slice(nominalIndex + 1)]
            .map(token => token.trim())
            .filter(isNotEmptyString);

        if (!isDefined(quantityText) || !NUMBER_REGEX.test(quantityText)) {
            return Result.fail(`Quantity not found for ${isin}`);
        }

        const quantity = this.parseNumber(quantityText);
        const isTotalInconsistent =
            isDefined(totalText) &&
            NUMBER_REGEX.test(totalText) &&
            Math.abs(quantity * this.parseNumber(nominalText) - this.parseNumber(totalText)) > TOTAL_TOLERANCE;

        return isTotalInconsistent ? Result.fail(`Quantity does not match total face value for ${isin}`) : Result.succeed(quantity);
    }

    private parseHolding(
        items: readonly PdfTextItemInterface[],
        anchor: PdfTextItemInterface,
        nextAnchor: PdfTextItemInterface | undefined
    ): Result.Result<InzhurHoldingInterface, string> {
        const isin = InzhurStatementParser.ISIN_REGEX.exec(anchor.text)?.[0] ?? '';
        const rowItems = items
            .filter(
                item =>
                    item !== anchor &&
                    item.page === anchor.page &&
                    Math.abs(item.y - anchor.y) <= InzhurStatementParser.Y_ROW_TOLERANCE &&
                    item.x > anchor.x
            )
            .sort((left, right) => left.x - right.x);
        const tokens = [
            anchor.text.slice(anchor.text.indexOf(isin) + InzhurStatementParser.ISIN_LENGTH),
            ...rowItems.map(item => item.text)
        ]
            .map(token => token.trim())
            .filter(isNotEmptyString);
        const quantity = this.parseQuantity(tokens, isin);

        return Result.isFailure(quantity)
            ? Result.fail(quantity.failure)
            : Result.succeed({
                  isin,
                  name: this.resolveFundName(this.collectNameLines(items, anchor, nextAnchor), isin),
                  quantity: quantity.success
              });
    }

    private mergeHoldings(holdings: readonly InzhurHoldingInterface[]): InzhurHoldingInterface[] {
        const holdingByIsin = new Map<string, InzhurHoldingInterface>();

        for (const holding of holdings) {
            const existing = holdingByIsin.get(holding.isin);

            holdingByIsin.set(
                holding.isin,
                isDefined(existing) ? { ...existing, quantity: existing.quantity + holding.quantity } : holding
            );
        }

        return [...holdingByIsin.values()];
    }

    private parseHoldings(items: readonly PdfTextItemInterface[]): Result.Result<InzhurHoldingInterface[], string> {
        const anchors = items
            .filter(item => InzhurStatementParser.ISIN_REGEX.test(item.text))
            .sort((left, right) => this.compareByReadingOrder(left, right));

        if (isEmptyArray(anchors)) {
            return Result.fail('No securities holdings found in the statement');
        }

        const holdings: InzhurHoldingInterface[] = [];

        for (const [index, anchor] of anchors.entries()) {
            const holding = this.parseHolding(items, anchor, anchors.at(index + 1));

            if (Result.isFailure(holding)) {
                return Result.fail(holding.failure);
            }

            holdings.push(holding.success);
        }

        return Result.succeed(this.mergeHoldings(holdings));
    }
}

export const inzhurStatementParser = new InzhurStatementParser();
