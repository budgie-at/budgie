import { convertToMicroUnits } from '@budgie/contracts';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import { read, utils } from 'xlsx';

import { isPositiveNumber, getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isNumber, isString } from '@rnw-community/shared';

import { INZHUR_CANONICAL_FUNDS } from '../constant/inzhur-canonical-funds.constant';
import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';
import { InzhurStatementInvalidError } from '../error/inzhur-statement-invalid.error';

import type { InzhurOperationPatternInterface } from '../interface/inzhur-operation-pattern.interface';
import type { InzhurOperationRowInterface } from '../interface/inzhur-operation-row.interface';
import type { InzhurOperationInterface } from '../interface/inzhur-operation.interface';
import type { InzhurOperationsExportInterface } from '../interface/inzhur-operations-export.interface';
import type { InzhurRawOperationInterface } from '../interface/inzhur-raw-operation.interface';
import type { WorkBook, WorkSheet } from 'xlsx';

class InzhurOperationsParser {
    private static readonly OPERATION_PATTERNS: readonly InzhurOperationPatternInterface[] = [
        { kind: InzhurOperationKindEnum.TOP_UP, pattern: /^поповнення\s+брокерського\s+рахунку/iu, isIncoming: true, needsFund: false },
        {
            kind: InzhurOperationKindEnum.WITHDRAWAL,
            pattern: /^виведення\s+з\s+брокерського\s+рахунку/iu,
            isIncoming: false,
            needsFund: false
        },
        { kind: InzhurOperationKindEnum.BUY, pattern: /^купівля\s+(\d+(?:[.,]\d+)?)\s+сертифікат/iu, isIncoming: false, needsFund: true },
        { kind: InzhurOperationKindEnum.SELL, pattern: /^продаж\s+(\d+(?:[.,]\d+)?)\s+сертифікат/iu, isIncoming: true, needsFund: true },
        { kind: InzhurOperationKindEnum.DIVIDEND, pattern: /^нарахування\s+дивіденд/iu, isIncoming: true, needsFund: true },
        { kind: InzhurOperationKindEnum.TAX, pattern: /^сплата\s+податку/iu, isIncoming: false, needsFund: true },
        { kind: InzhurOperationKindEnum.CONVERSION, pattern: /^конвертація/iu, isIncoming: null, needsFund: true },
        { kind: InzhurOperationKindEnum.SURCHARGE, pattern: /^доплата/iu, isIncoming: false, needsFund: true }
    ];

    private static readonly SHEET_NAME = 'Виписка по операціям';
    private static readonly HEADER = ['дата', 'тип операції', 'вид цінного паперу', 'дебет', 'кредит'];
    private static readonly TIME_ZONE = 'Europe/Kyiv';
    private static readonly NO_FUND_MARKER = '-';

    parse(bytes: Uint8Array): Effect.Effect<InzhurOperationsExportInterface, InzhurStatementInvalidError> {
        return Effect.try({
            try: () => read(bytes, { type: 'buffer' }),
            catch: error => InzhurStatementInvalidError.make({ reason: getErrorMessage(error) })
        }).pipe(
            Effect.flatMap(workbook =>
                Effect.fromResult(this.parseWorkbook(workbook)).pipe(
                    Effect.mapError(reason => InzhurStatementInvalidError.make({ reason }))
                )
            )
        );
    }

    private parseWorkbook(workbook: WorkBook): Result.Result<InzhurOperationsExportInterface, string> {
        const sheet = this.findSheet(workbook);

        if (!isDefined(sheet)) {
            return Result.fail('The workbook contains no sheets');
        }

        const [header = [], ...rows]: unknown[][] = utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

        if (!InzhurOperationsParser.HEADER.every((title, index) => this.toText(header[index]).trim().toLowerCase() === title)) {
            return Result.fail('The document is not an Inzhur operations statement');
        }

        return Result.flatMap(this.parseRows(rows), parsed => {
            const operations = this.assignExternalIds(parsed.map(operation => operation.recognised));

            return isNotEmptyArray(operations)
                ? Result.succeed({
                      operations,
                      unrecognised: this.countUnrecognised(
                          parsed.filter(operation => !isDefined(operation.recognised)).map(operation => operation.type)
                      )
                  })
                : Result.fail('The statement contains no recognised operations');
        });
    }

    private findSheet(workbook: WorkBook): WorkSheet | null {
        const name = workbook.SheetNames.includes(InzhurOperationsParser.SHEET_NAME)
            ? InzhurOperationsParser.SHEET_NAME
            : workbook.SheetNames.at(0);

        return isDefined(name) ? (workbook.Sheets[name] ?? null) : null;
    }

    private toText(value: unknown): string {
        if (isString(value)) {
            return value;
        }

        return isNumber(value) ? String(value) : '';
    }

    private parseRows(
        rows: readonly unknown[][]
    ): Result.Result<{ readonly type: string; readonly recognised: InzhurRawOperationInterface | null }[], string> {
        const entries = rows
            .map((row, index): InzhurOperationRowInterface | null => {
                const type = this.toText(row[1]).trim();
                const seconds = this.parseSeconds(row[0]);

                return isNotEmptyString(type)
                    ? {
                          index,
                          type,
                          seconds: seconds ?? Number.NaN,
                          fund: this.toText(row[2]),
                          debit: this.parseAmount(row[3]),
                          credit: this.parseAmount(row[4])
                      }
                    : null;
            })
            .filter(isDefined);
        const invalid = entries.find(entry => Number.isNaN(entry.seconds));

        return isDefined(invalid)
            ? Result.fail(`Invalid operation date in row ${invalid.index + 2}`)
            : Result.succeed(entries.map(entry => ({ type: entry.type, recognised: this.classify(entry) })));
    }

    private classify(entry: InzhurOperationRowInterface): InzhurRawOperationInterface | null {
        const fundName = this.normalizeFundName(entry.fund);
        const matched = InzhurOperationsParser.OPERATION_PATTERNS.find(candidate => candidate.pattern.test(entry.type));

        if (!isDefined(matched) || !this.isSideValid(matched.isIncoming, entry) || (matched.needsFund && !isDefined(fundName))) {
            return null;
        }

        const quantityText = matched.pattern.exec(entry.type)?.[1];

        return {
            index: entry.index,
            seconds: entry.seconds,
            kind: matched.kind,
            fundName,
            quantity: isDefined(quantityText) ? Number(quantityText.replace(',', '.')) : null,
            debit: entry.debit,
            credit: entry.credit
        };
    }

    private isSideValid(isIncoming: boolean | null, { debit, credit }: Pick<InzhurOperationRowInterface, 'debit' | 'credit'>): boolean {
        if (!isDefined(isIncoming)) {
            return isPositiveNumber(debit) !== isPositiveNumber(credit);
        }

        return isIncoming ? isPositiveNumber(debit) && credit === 0 : isPositiveNumber(credit) && debit === 0;
    }

    private normalizeFundName(rawFund: string): string | null {
        const name = rawFund.trim();

        if (!isNotEmptyString(name) || name === InzhurOperationsParser.NO_FUND_MARKER) {
            return null;
        }

        return INZHUR_CANONICAL_FUNDS.find(fund => fund.name.toLowerCase() === name.toLowerCase())?.name ?? name;
    }

    private parseAmount(value: unknown): number {
        const parsed = isNumber(value) ? value : Number(this.toText(value).replaceAll(/[\s ]/gu, '').replace(',', '.'));

        return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
    }

    private parseSeconds(value: unknown): number | null {
        if (!isNumber(value)) {
            return null;
        }

        const excelEpochOffsetDays = 25_569;
        const secondsPerDay = 86_400;
        const millisecondsPerSecond = 1000;
        const local = new Date(Math.round((value - excelEpochOffsetDays) * secondsPerDay) * millisecondsPerSecond);

        return Option.match(
            DateTime.makeZoned(
                {
                    year: local.getUTCFullYear(),
                    month: local.getUTCMonth() + 1,
                    day: local.getUTCDate(),
                    hour: local.getUTCHours(),
                    minute: local.getUTCMinutes(),
                    second: local.getUTCSeconds()
                },
                { timeZone: InzhurOperationsParser.TIME_ZONE, adjustForTimeZone: true }
            ),
            { onNone: () => null, onSome: zoned => Math.round(DateTime.toEpochMillis(zoned) / millisecondsPerSecond) }
        );
    }

    private countUnrecognised(types: readonly string[]) {
        const counts = new Map<string, number>();

        for (const type of types) {
            counts.set(type, (counts.get(type) ?? 0) + 1);
        }

        return [...counts].map(([operation, count]) => ({ operation, count }));
    }

    private assignExternalIds(operations: readonly (InzhurRawOperationInterface | null)[]): InzhurOperationInterface[] {
        const ordinals = new Map<string, number>();
        const millisecondsPerSecond = 1000;

        return operations
            .filter(isDefined)
            .sort((left, right) => left.seconds - right.seconds || right.index - left.index)
            .map(({ seconds, kind, fundName, quantity, debit, credit }) => {
                const fundKey = fundName?.toUpperCase().replaceAll(/\s+/gu, '-') ?? InzhurOperationsParser.NO_FUND_MARKER;
                const amountMicroUnits = convertToMicroUnits(isPositiveNumber(debit) ? debit : credit);
                const key = [seconds, kind, fundKey, amountMicroUnits, isPositiveNumber(debit)].join('|');
                const ordinal = ordinals.get(key) ?? 0;

                ordinals.set(key, ordinal + 1);

                return {
                    externalId: `${INZHUR_OPERATION_EXTERNAL_ID_PREFIX}${seconds}:${kind}:${fundKey}:${amountMicroUnits}:${ordinal}`,
                    kind,
                    occurredAt: new Date(seconds * millisecondsPerSecond),
                    fundName,
                    quantity,
                    debit,
                    credit
                };
            });
    }
}

export const inzhurOperationsParser = new InzhurOperationsParser();
