import {
    CurrencyEnum,
    InstrumentRepository,
    InvestmentReturnRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    convertFromMicroUnits
} from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { InzhurGainRangeEnum } from '../enum/inzhur-gain-range.enum';
import { toKyivDay } from '../utils/to-kyiv-day.util';

import { InzhurSetupService } from './inzhur-setup.service';

import type { InzhurCostReturnInterface } from '../interface/inzhur-cost-return.interface';
import type { InzhurDatedMovementInterface } from '../interface/inzhur-dated-movement.interface';
import type { InzhurGainLedgerInterface } from '../interface/inzhur-gain-ledger.interface';
import type { InzhurGainMeasureInterface } from '../interface/inzhur-gain-measure.interface';
import type { InzhurGainReportInterface } from '../interface/inzhur-gain-report.interface';
import type { InzhurGainInterface } from '../interface/inzhur-gain.interface';
import type { InzhurRangedGainInterface } from '../interface/inzhur-ranged-gain.interface';
import type { InzhurValuePointInterface } from '../interface/inzhur-value-point.interface';
import type { LedgerMovementInterface } from '@budgie/contracts';

export class InzhurGainService extends Context.Service<InzhurGainService>()('@budgie/sync/InzhurGainService', {
    make: Effect.gen(function* () {
        const investmentReturnRepository = yield* InvestmentReturnRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const inzhurSetupService = yield* InzhurSetupService;
        const dayMilliseconds = 86_400_000;
        const priceHistoryLimit = 1000;
        const rangeDays = { [InzhurGainRangeEnum.MONTH]: 30, [InzhurGainRangeEnum.THREE_MONTHS]: 90 };

        const shiftDay = (day: string, days: number) =>
            new Date(Date.parse(`${day}T00:00:00.000Z`) + days * dayMilliseconds).toISOString().slice(0, 10);
        const roundMoney = (value: number) => Math.round(value * 100) / 100;
        const signedAmount = (movement: LedgerMovementInterface) =>
            convertFromMicroUnits(movement.entryType === TransactionEntryTypeEnum.DEBIT ? movement.amount : -movement.amount);

        const listDays = (firstDay: string, lastDay: string) => {
            const days: string[] = [];

            for (let day = firstDay; day <= lastDay; day = shiftDay(day, 1)) {
                days.push(day);
            }

            return days;
        };

        const findPriceOn = (prices: readonly InzhurValuePointInterface[], day: string) =>
            prices.findLast(price => price.date <= day)?.value ?? null;

        const loadLedger = Effect.fnUntraced(function* () {
            const setup = yield* inzhurSetupService.findSetup();

            if (!isDefined(setup)) {
                return null;
            }

            const cashAccountId = setup.cashAccount.id;
            const fundAccountIds = setup.fundAccounts.map(account => account.id);
            const movements = yield* investmentReturnRepository.findLedgerMovements([cashAccountId, ...fundAccountIds]);
            const firstFundMovement = movements.find(movement => fundAccountIds.includes(movement.accountId));

            if (!isDefined(firstFundMovement)) {
                return null;
            }

            const firstDay = toKyivDay(firstFundMovement.operatedAt);
            const openings = new Set(
                [cashAccountId, ...fundAccountIds]
                    .map(accountId =>
                        movements.find(
                            movement => movement.accountId === accountId && movement.transactionType === TransactionTypeEnum.ADJUSTMENT
                        )
                    )
                    .filter(isDefined)
            );
            const dated = movements.map(movement => ({
                movement,
                day: openings.has(movement) ? firstDay : toKyivDay(movement.operatedAt),
                amount: signedAmount(movement)
            }));
            const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);
            const priceEntries = yield* Effect.forEach(setup.fundAccounts, account =>
                Effect.map(
                    isDefined(hryvnia)
                        ? instrumentDailyMarketPriceRepository.findRecent(account.instrumentId, hryvnia.id, priceHistoryLimit)
                        : Effect.succeed([]),
                    rows => [account.id, rows.map(row => ({ date: row.priceDate, value: row.price })).toReversed()] as const
                )
            );
            const pricesByAccountId = new Map(priceEntries);

            return { cashAccountId, fundAccountIds, firstDay, dated, pricesByAccountId };
        });

        const balanceOn = (ledger: InzhurGainLedgerInterface, accountId: number, day: string) =>
            ledger.dated.reduce(
                (total, item) => (item.movement.accountId === accountId && item.day <= day ? total + item.amount : total),
                0
            );

        const fundValueOn = (ledger: InzhurGainLedgerInterface, accountId: number, day: string) => {
            const quantity = balanceOn(ledger, accountId, day);
            const price = findPriceOn(ledger.pricesByAccountId.get(accountId) ?? [], day);

            if (quantity === 0) {
                return 0;
            }

            return isDefined(price) ? quantity * price : null;
        };

        const institutionValueOn = (ledger: InzhurGainLedgerInterface, day: string) => {
            const fundValues = ledger.fundAccountIds.map(accountId => fundValueOn(ledger, accountId, day));

            if (fundValues.some(value => !isDefined(value))) {
                return null;
            }

            return fundValues.reduce<number>((total, value) => total + (value ?? 0), balanceOn(ledger, ledger.cashAccountId, day));
        };

        const findCounterpartId = (ledger: InzhurGainLedgerInterface, movement: LedgerMovementInterface) =>
            movement.fromAccountId === ledger.cashAccountId ? movement.toAccountId : movement.fromAccountId;

        const institutionFlowOf = (ledger: InzhurGainLedgerInterface, item: InzhurDatedMovementInterface) => {
            const { accountId, fundAccountId } = item.movement;
            const isInstitutionAccount = accountId === ledger.cashAccountId || ledger.fundAccountIds.includes(accountId);

            if (!isInstitutionAccount) {
                return isDefined(fundAccountId) ? -item.amount : 0;
            }

            const counterpartId = findCounterpartId(ledger, item.movement);
            const isExternalTransfer =
                item.movement.transactionType === TransactionTypeEnum.TRANSFER &&
                (!isDefined(counterpartId) || !ledger.fundAccountIds.includes(counterpartId));

            return item.movement.accountId === ledger.cashAccountId && isExternalTransfer ? item.amount : 0;
        };

        const fundFlowOf = (ledger: InzhurGainLedgerInterface, accountId: number, item: InzhurDatedMovementInterface) => {
            const isTrade =
                item.movement.accountId === ledger.cashAccountId &&
                item.movement.transactionType === TransactionTypeEnum.TRANSFER &&
                findCounterpartId(ledger, item.movement) === accountId;
            const isReinvestedDividend =
                item.movement.transactionType === TransactionTypeEnum.INCOME && item.movement.fundAccountId === accountId;

            const isLinkedTax = item.movement.transactionType === TransactionTypeEnum.EXPENSE && item.movement.fundAccountId === accountId;

            return isTrade || isReinvestedDividend || isLinkedTax ? -item.amount : 0;
        };

        const buildGain = (
            ledger: InzhurGainLedgerInterface,
            { valueOn, flowOf }: InzhurGainMeasureInterface,
            startDate: string,
            today: string
        ): InzhurGainInterface => {
            const startValue = valueOn(startDate);
            const endValue = valueOn(today);
            const contributions = ledger.dated
                .filter(item => item.day > startDate && item.day <= today)
                .reduce((total, item) => total + flowOf(item), 0);
            const gain = isDefined(startValue) && isDefined(endValue) ? endValue - startValue - contributions : null;
            const base = isDefined(startValue) ? startValue + contributions : 0;

            return {
                startDate,
                startValue: isDefined(startValue) ? roundMoney(startValue) : null,
                endValue: isDefined(endValue) ? roundMoney(endValue) : null,
                contributions: roundMoney(contributions),
                gain: isDefined(gain) ? roundMoney(gain) : null,
                percent: isDefined(gain) && isPositiveNumber(base) ? gain / base : null
            };
        };

        const buildRangedGains = (
            ledger: InzhurGainLedgerInterface,
            measure: InzhurGainMeasureInterface,
            today: string,
            startDay: string
        ): InzhurRangedGainInterface[] => {
            const ranged = ([InzhurGainRangeEnum.MONTH, InzhurGainRangeEnum.THREE_MONTHS] as const)
                .map(range => ({ range, startDate: shiftDay(today, -rangeDays[range]) }))
                .filter(({ startDate }) => startDate > startDay);

            return [...ranged, { range: InzhurGainRangeEnum.ALL, startDate: startDay }].map(({ range, startDate }) => ({
                range,
                ...buildGain(ledger, measure, startDate, today)
            }));
        };

        const buildSeries = (ledger: InzhurGainLedgerInterface, today: string, valueOn: (day: string) => number | null) =>
            listDays(ledger.firstDay, today)
                .map(date => ({ date, value: valueOn(date) }))
                .filter((point): point is InzhurValuePointInterface => isDefined(point.value))
                .map(point => ({ date: point.date, value: roundMoney(point.value) }));

        const buildGainSeries = (ledger: InzhurGainLedgerInterface, measure: InzhurGainMeasureInterface, today: string, startDay: string) =>
            listDays(startDay, today)
                .map(date => ({ date, value: buildGain(ledger, measure, startDay, date).gain }))
                .filter((point): point is InzhurValuePointInterface => isDefined(point.value));

        const buildReport = (ledger: InzhurGainLedgerInterface, measure: InzhurGainMeasureInterface, today: string) => {
            const startDay = listDays(ledger.firstDay, today).find(day => isDefined(measure.valueOn(day))) ?? ledger.firstDay;

            return {
                series: buildSeries(ledger, today, measure.valueOn),
                gainSeries: buildGainSeries(ledger, measure, today, startDay),
                gains: buildRangedGains(ledger, measure, today, startDay)
            };
        };

        return {
            getInstitutionReport: Effect.fn('InzhurGainService.getInstitutionReport')(function* (today: string) {
                const ledger = yield* loadLedger();

                if (!isDefined(ledger)) {
                    return null;
                }

                const measure = {
                    valueOn: (day: string) => institutionValueOn(ledger, day),
                    flowOf: (item: InzhurDatedMovementInterface) => institutionFlowOf(ledger, item)
                };

                return {
                    ...buildReport(ledger, measure, today),
                    prices: []
                } satisfies InzhurGainReportInterface;
            }),
            getFundReport: Effect.fn('InzhurGainService.getFundReport')(function* (fundAccountId: number, today: string) {
                const ledger = yield* loadLedger();

                if (!isDefined(ledger) || !ledger.fundAccountIds.includes(fundAccountId)) {
                    return null;
                }

                const measure = {
                    valueOn: (day: string) => fundValueOn(ledger, fundAccountId, day),
                    flowOf: (item: InzhurDatedMovementInterface) => fundFlowOf(ledger, fundAccountId, item)
                };

                return {
                    ...buildReport(ledger, measure, today),
                    prices: (ledger.pricesByAccountId.get(fundAccountId) ?? []).filter(
                        price => price.date >= ledger.firstDay && price.date <= today
                    )
                } satisfies InzhurGainReportInterface;
            }),
            getFundCostReturn: Effect.fn('InzhurGainService.getFundCostReturn')(function* (fundAccountId: number, today: string) {
                const ledger = yield* loadLedger();

                if (!isDefined(ledger) || !ledger.fundAccountIds.includes(fundAccountId)) {
                    return null;
                }

                const value = fundValueOn(ledger, fundAccountId, today);

                if (!isDefined(value)) {
                    return null;
                }

                const cashItems = ledger.dated.filter(item => item.movement.accountId === ledger.cashAccountId && item.day <= today);
                const trades = cashItems.filter(
                    item =>
                        item.movement.transactionType === TransactionTypeEnum.TRANSFER &&
                        findCounterpartId(ledger, item.movement) === fundAccountId
                );
                const fundItems = ledger.dated.filter(item => item.day <= today && item.movement.fundAccountId === fundAccountId);
                const invested = trades.filter(item => item.amount < 0).reduce((total, item) => total - item.amount, 0);
                const proceeds = trades.filter(item => isPositiveNumber(item.amount)).reduce((total, item) => total + item.amount, 0);
                const dividends = fundItems
                    .filter(item => item.movement.transactionType === TransactionTypeEnum.INCOME)
                    .reduce((total, item) => total + item.amount, 0);
                const tax = fundItems
                    .filter(item => item.movement.transactionType === TransactionTypeEnum.EXPENSE)
                    .reduce((total, item) => total - item.amount, 0);
                const returnAmount = value + proceeds + dividends - tax - invested;

                return {
                    invested: roundMoney(invested),
                    proceeds: roundMoney(proceeds),
                    dividends: roundMoney(dividends),
                    tax: roundMoney(tax),
                    value: roundMoney(value),
                    returnAmount: roundMoney(returnAmount),
                    percent: isPositiveNumber(invested) ? returnAmount / invested : null
                } satisfies InzhurCostReturnInterface;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurGainService, InzhurGainService.make).pipe(
        Layer.provide([
            InvestmentReturnRepository.layer,
            InstrumentRepository.layer,
            InstrumentDailyMarketPriceRepository.layer,
            InzhurSetupService.layer
        ])
    );
}
