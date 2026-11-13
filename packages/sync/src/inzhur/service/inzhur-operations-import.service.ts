import {
    AccountBalanceRepository,
    Db,
    INVESTMENTS_CATEGORY_ID,
    TAXES_CATEGORY_ID,
    SyncRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransactionService, TransferCreationService } from '@budgie/ledger';
import { InzhurPriceService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { buildPrimaryEntry } from '../../core/utils/build-primary-entry.util';
import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';
import { INZHUR_MANUAL_EXTERNAL_ID_PREFIX } from '../constant/inzhur-manual-external-id-prefix.constant';
import { INZHUR_OPENING_BALANCE_EXTERNAL_ID } from '../constant/inzhur-opening-balance-external-id.constant';
import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';
import { InzhurPriceMissingError } from '../error/inzhur-price-missing.error';
import { inzhurOperationsParser } from '../parser/inzhur-operations.parser';
import { inzhurOperationsPlanner } from '../planner/inzhur-operations.planner';
import { inzhurQuantityResolver } from '../planner/inzhur-quantity.resolver';
import { buildInzhurTradeEntries } from '../utils/build-inzhur-trade-entries.util';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';
import { buildInzhurYieldFields } from '../utils/build-inzhur-yield-fields.util';
import { findLowestDayEndBalance } from '../utils/find-lowest-day-end-balance.util';
import { getKyivDayStart } from '../utils/get-kyiv-day-start.util';
import { isInzhurPeriod } from '../utils/is-inzhur-period.util';
import { parseInzhurOperationExternalId } from '../utils/parse-inzhur-operation-external-id.util';
import { sumSignedAccountEntries } from '../utils/sum-signed-account-entries.util';
import { toInzhurShortName } from '../utils/to-inzhur-short-name.util';
import { toKyivDay } from '../utils/to-kyiv-day.util';

import { InzhurBankFlowService } from './inzhur-bank-flow.service';
import { InzhurFundAccountService } from './inzhur-fund-account.service';
import { InzhurOpeningBalanceService } from './inzhur-opening-balance.service';
import { InzhurOperationsBankPairingService } from './inzhur-operations-bank-pairing.service';
import { InzhurSetupService } from './inzhur-setup.service';

import type { InzhurOperationsExportInterface } from '../interface/inzhur-operations-export.interface';
import type { InzhurOperationsFundSummaryInterface } from '../interface/inzhur-operations-fund-summary.interface';
import type { InzhurOperationsImportSummaryInterface } from '../interface/inzhur-operations-import-summary.interface';
import type { InzhurPlannedActionInterface } from '../interface/inzhur-planned-action.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { AccountEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';
import type { InzhurFundPriceInterface } from '@budgie/market';

export class InzhurOperationsImportService extends Context.Service<InzhurOperationsImportService>()(
    '@budgie/sync/InzhurOperationsImportService',
    {
        make: Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const syncRepository = yield* SyncRepository;
            const transactionRepository = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const transferCreationService = yield* TransferCreationService;
            const inzhurPriceService = yield* InzhurPriceService;
            const inzhurBankFlowService = yield* InzhurBankFlowService;
            const inzhurOpeningBalanceService = yield* InzhurOpeningBalanceService;
            const inzhurFundAccountService = yield* InzhurFundAccountService;
            const inzhurOperationsBankPairingService = yield* InzhurOperationsBankPairingService;
            const inzhurSetupService = yield* InzhurSetupService;
            const syncFileReader = yield* SyncFileReader;
            const syncWorkload = yield* SyncWorkload;
            const millisecondsPerSecond = 1000;

            const isManualPurchase = (transaction: TransactionWithEntriesEntityInterface) =>
                isDefined(transaction.externalId) && transaction.externalId.startsWith(INZHUR_MANUAL_EXTERNAL_ID_PREFIX);

            const sumQuantity = (
                ledger: readonly TransactionWithEntriesEntityInterface[],
                accountId: number,
                isIncluded: (transaction: TransactionWithEntriesEntityInterface) => boolean
            ) => ledger.filter(isIncluded).reduce((sum, transaction) => sum + sumSignedAccountEntries(transaction.entries, accountId), 0);

            const buildSummaryFunds = (
                actions: readonly InzhurPlannedActionInterface[],
                accountByFund: ReadonlyMap<string, AccountEntityInterface>,
                quantityMicroUnits: (action: InzhurPlannedActionInterface) => { readonly microUnits: number; readonly isEstimated: boolean }
            ): InzhurOperationsFundSummaryInterface[] =>
                [...accountByFund].map(([name, account]) => {
                    const fundActions = actions.filter(action => action.fundName === name);
                    const select = (kind: InzhurOperationKindEnum, isConversion: boolean) =>
                        fundActions.filter(action => action.kind === kind && action.isConversion === isConversion);
                    const sum = (
                        selected: readonly InzhurPlannedActionInterface[],
                        pick: (action: InzhurPlannedActionInterface) => number
                    ) => convertFromMicroUnits(selected.reduce((total, action) => total + pick(action), 0));
                    const quantityOf = (action: InzhurPlannedActionInterface) => quantityMicroUnits(action).microUnits;
                    const cashOf = (action: InzhurPlannedActionInterface) => convertToMicroUnits(action.cashAmount);
                    const counterpartOf = (conversion: InzhurPlannedActionInterface) =>
                        actions
                            .filter(
                                action =>
                                    action.isConversion &&
                                    action.kind !== conversion.kind &&
                                    isDefined(action.fundName) &&
                                    action.fundName !== name
                            )
                            .sort(
                                (left, right) =>
                                    Math.abs(left.occurredAt.getTime() - conversion.occurredAt.getTime()) -
                                    Math.abs(right.occurredAt.getTime() - conversion.occurredAt.getTime())
                            )
                            .at(0)?.fundName ?? null;
                    const conversionsIn = select(InzhurOperationKindEnum.BUY, true);
                    const conversionsOut = select(InzhurOperationKindEnum.SELL, true);

                    return {
                        accountId: account.id,
                        name,
                        boughtQuantity: sum(select(InzhurOperationKindEnum.BUY, false), quantityOf),
                        boughtAmount: sum(select(InzhurOperationKindEnum.BUY, false), cashOf),
                        soldQuantity: sum(select(InzhurOperationKindEnum.SELL, false), quantityOf),
                        soldAmount: sum(select(InzhurOperationKindEnum.SELL, false), cashOf),
                        convertedInQuantity: sum(conversionsIn, quantityOf),
                        convertedInAmount: sum(conversionsIn, cashOf),
                        convertedInFrom: isNotEmptyArray(conversionsIn) ? counterpartOf(conversionsIn[0]) : null,
                        isConvertedInEstimated: conversionsIn.some(action => quantityMicroUnits(action).isEstimated),
                        convertedOutQuantity: sum(conversionsOut, quantityOf),
                        convertedOutTo: isNotEmptyArray(conversionsOut) ? counterpartOf(conversionsOut[0]) : null,
                        dividends: sum(select(InzhurOperationKindEnum.DIVIDEND, false), cashOf),
                        tax: sum(select(InzhurOperationKindEnum.TAX, false), cashOf)
                    };
                });

            const buildIncomeOrTaxInput = (
                action: InzhurPlannedActionInterface,
                cashAccount: AccountEntityInterface,
                fundAccount: AccountEntityInterface
            ) => {
                const isDividend = action.kind === InzhurOperationKindEnum.DIVIDEND;
                const entry = {
                    ...buildPrimaryEntry(
                        cashAccount.id,
                        isDividend ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                        action.cashAmount,
                        action.externalId
                    ),
                    categoryId: isDividend ? INVESTMENTS_CATEGORY_ID : TAXES_CATEGORY_ID
                };
                const title = `${toInzhurShortName(fundAccount.title)} ${isDividend ? 'dividends' : 'dividend tax'}`;
                const input = buildInzhurTransactionInput(title, action.externalId, action.occurredAt, [entry]);
                const yieldFields = buildInzhurYieldFields({ type: input.type, fundAccountId: fundAccount.id, title });

                return {
                    ...input,
                    fundAccountId: fundAccount.id,
                    ...(isDefined(yieldFields) && {
                        yieldKind: yieldFields.yieldKind,
                        yieldSourceAccountId: cashAccount.syncZone === fundAccount.syncZone ? yieldFields.yieldSourceAccountId : null
                    })
                };
            };

            const readPriceMap = Effect.fnUntraced(function* (
                actions: readonly InzhurPlannedActionInterface[],
                accountByFund: ReadonlyMap<string, AccountEntityInterface>,
                newExternalIds: ReadonlySet<string>,
                currentPrices: readonly InzhurFundPriceInterface[]
            ) {
                const priced = actions.filter(
                    action =>
                        isDefined(action.fundName) &&
                        !isDefined(action.quantity) &&
                        (action.kind === InzhurOperationKindEnum.BUY || action.isSellAll)
                );
                const entries = yield* Effect.forEach(priced, action =>
                    Effect.map(
                        inzhurPriceService.findNearestPrice(
                            accountByFund.get(action.fundName ?? '')?.instrumentId ?? 0,
                            toKyivDay(action.occurredAt)
                        ),
                        price => [action.externalId, price] as const
                    )
                );

                const priceByExternalId = new Map(
                    entries.flatMap(([externalId, price]) => (isDefined(price) ? [[externalId, price] as const] : []))
                );
                const missing = priced.filter(action => newExternalIds.has(action.externalId) && !priceByExternalId.has(action.externalId));

                if (!isNotEmptyArray(missing)) {
                    return priceByExternalId;
                }

                for (const action of missing) {
                    const current = currentPrices.find(item => item.fundName.toLowerCase() === action.fundName?.toLowerCase());

                    if (isDefined(current)) {
                        priceByExternalId.set(action.externalId, current.price);
                    }
                }

                return priceByExternalId;
            });

            const adjustOpeningCash = Effect.fnUntraced(function* (setup: InzhurSetupInterface, firstAt: Date, lastAt: Date) {
                const cashAccountId = setup.cashAccount.id;
                const openingAt = DateTime.toDateUtc(DateTime.makeUnsafe(firstAt.getTime() - millisecondsPerSecond));

                const cashLedger = yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId]);
                const isPreExportBankFlow = (transaction: TransactionWithEntriesEntityInterface) =>
                    transaction.operatedAt < firstAt &&
                    INZHUR_BANK_DESCRIPTION_PATTERNS.externalSources.some(source => source === transaction.externalSource) &&
                    !transaction.entries.some(entry => entry.externalId?.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX));
                const movements = cashLedger
                    .filter(transaction => transaction.externalId !== INZHUR_OPENING_BALANCE_EXTERNAL_ID)
                    .map(transaction => ({
                        at:
                            parseInzhurOperationExternalId(
                                transaction.entries.find(
                                    entry =>
                                        entry.accountId === cashAccountId &&
                                        entry.externalId?.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX)
                                )?.externalId ??
                                    transaction.externalId ??
                                    ''
                            )?.occurredAt ?? transaction.operatedAt,
                        delta: sumSignedAccountEntries(transaction.entries, cashAccountId),
                        isPreExportBankFlow: isPreExportBankFlow(transaction)
                    }))
                    .filter(movement => movement.at <= lastAt);
                const preExportBankDelta = movements
                    .filter(movement => movement.isPreExportBankFlow)
                    .reduce((sum, movement) => sum + movement.delta, 0);
                const lowest = findLowestDayEndBalance(movements.filter(movement => !movement.isPreExportBankFlow));

                yield* inzhurOpeningBalanceService.replace(cashAccountId, -lowest - preExportBankDelta, openingAt);
            });

            const run = Effect.fnUntraced(function* (
                setup: InzhurSetupInterface,
                exported: InzhurOperationsExportInterface,
                currentPrices: readonly InzhurFundPriceInterface[]
            ) {
                const plan = inzhurOperationsPlanner.plan(exported.operations);
                const cashAccountId = setup.cashAccount.id;
                const periodStart = getKyivDayStart(toKyivDay(plan.firstAt));
                const periodEnd = getKyivDayStart(toKyivDay(plan.lastAt), 1);

                const accountByFund = new Map<string, AccountEntityInterface>();

                for (const name of new Set(plan.actions.flatMap(action => (isDefined(action.fundName) ? [action.fundName] : [])))) {
                    const fundAccount = yield* inzhurFundAccountService.ensureByName(setup, name);

                    accountByFund.set(name, fundAccount);
                }

                const fundAccounts = [
                    ...setup.fundAccounts,
                    ...[...accountByFund.values()].filter(account => !setup.fundAccounts.some(existing => existing.id === account.id))
                ];

                yield* inzhurBankFlowService.convert({ ...setup, fundAccounts }, null);

                const fundAccountIds = fundAccounts.map(account => account.id);
                const before = yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId, ...fundAccountIds]);
                const replacedPurchases = before.filter(
                    transaction => isInzhurPeriod(transaction, { from: periodStart, until: periodEnd }) && isManualPurchase(transaction)
                );

                for (const superseded of replacedPurchases) {
                    yield* transactionService.purgeById(superseded.id);
                }

                const ledger = isNotEmptyArray(replacedPurchases)
                    ? yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId, ...fundAccountIds])
                    : before;
                const existingIds = new Set(
                    ledger.flatMap(transaction =>
                        [transaction.externalId, ...transaction.entries.map(entry => entry.externalId)].filter(isNotEmptyString)
                    )
                );
                const ledgerByExternalId = new Map(ledger.map(transaction => [transaction.externalId, transaction]));
                const storedTrade = (action: InzhurPlannedActionInterface) => {
                    const transaction = ledgerByExternalId.get(action.externalId);
                    const fundAccountId = accountByFund.get(action.fundName ?? '')?.id;

                    return {
                        transaction,
                        quantity: transaction?.entries.find(entry => entry.accountId === fundAccountId)?.amount,
                        cash: transaction?.entries.find(entry => entry.accountId === cashAccountId)?.amount
                    };
                };
                const newActions = plan.actions.filter(action => !existingIds.has(action.externalId));

                yield* inzhurPriceService.recordTradePrices(
                    plan.actions.flatMap(action => {
                        const instrumentId = accountByFund.get(action.fundName ?? '')?.instrumentId;

                        return isDefined(instrumentId) && isPositiveNumber(action.quantity)
                            ? [{ instrumentId, priceDate: toKyivDay(action.occurredAt), price: action.cashAmount / action.quantity }]
                            : [];
                    })
                );

                const quantities = inzhurQuantityResolver.resolve({
                    actions: plan.actions,
                    storedMicroUnitsByExternalId: new Map(
                        plan.actions.flatMap(action => {
                            const { quantity, cash } = storedTrade(action);
                            const isReestimated =
                                action.kind === InzhurOperationKindEnum.BUY &&
                                !isDefined(action.quantity) &&
                                isDefined(cash) &&
                                convertToMicroUnits(action.cashAmount) >= cash;

                            return isDefined(quantity) && !isReestimated ? [[action.externalId, quantity] as const] : [];
                        })
                    ),
                    baseMicroUnitsByFund: new Map(
                        [...accountByFund].map(([name, account]) => [
                            name,
                            sumQuantity(ledger, account.id, transaction => transaction.operatedAt < plan.firstAt)
                        ])
                    ),
                    priceByExternalId: yield* readPriceMap(
                        plan.actions,
                        accountByFund,
                        new Set(newActions.map(action => action.externalId)),
                        currentPrices
                    )
                });
                const isTrade = (action: InzhurPlannedActionInterface) =>
                    action.kind === InzhurOperationKindEnum.BUY || action.kind === InzhurOperationKindEnum.SELL;
                const unresolvedFundNames = newActions
                    .filter(action => isTrade(action) && !quantities.has(action.externalId))
                    .flatMap(action => (isDefined(action.fundName) ? [action.fundName] : []));

                if (isNotEmptyArray(unresolvedFundNames)) {
                    return yield* InzhurPriceMissingError.make({ fundNames: [...new Set(unresolvedFundNames)] });
                }

                const pairing = yield* inzhurOperationsBankPairingService.plan(setup, plan.actions, ledger, {
                    from: periodStart,
                    until: periodEnd
                });
                const { placeholderInputs } = pairing;

                const buildTradeInput = (action: InzhurPlannedActionInterface, account: AccountEntityInterface, microUnits: number) => {
                    const isSell = action.kind === InzhurOperationKindEnum.SELL;

                    return buildInzhurTransactionInput(
                        `${isSell ? 'Sold' : 'Bought'} ${toInzhurShortName(account.title)}`,
                        action.externalId,
                        action.occurredAt,
                        buildInzhurTradeEntries({
                            isSell,
                            externalId: action.externalId,
                            cashAccountId,
                            fundAccountId: account.id,
                            cashAmount: action.cashAmount,
                            quantity: convertFromMicroUnits(microUnits)
                        })
                    );
                };
                const amendedTrades = plan.actions
                    .filter(action => isTrade(action) && existingIds.has(action.externalId))
                    .flatMap(action => {
                        const { transaction: stored, quantity: storedQuantity, cash: storedCash } = storedTrade(action);
                        const account = accountByFund.get(action.fundName ?? '');

                        const quantity = isDefined(action.quantity)
                            ? storedQuantity
                            : (quantities.get(action.externalId)?.microUnits ?? storedQuantity);

                        return isDefined(stored) &&
                            isDefined(account) &&
                            isDefined(storedCash) &&
                            isDefined(storedQuantity) &&
                            isDefined(quantity) &&
                            (convertToMicroUnits(action.cashAmount) > storedCash || quantity !== storedQuantity)
                            ? [{ stored, action, account, quantity }]
                            : [];
                    });
                const tradeInputs = [
                    ...amendedTrades.map(({ action, account, quantity }) => buildTradeInput(action, account, quantity)),
                    ...newActions.filter(isTrade).flatMap(action => {
                        const account = accountByFund.get(action.fundName ?? '');
                        const quantity = quantities.get(action.externalId);

                        return isDefined(account) && isDefined(quantity) ? [buildTradeInput(action, account, quantity.microUnits)] : [];
                    })
                ];
                const incomeInputs = newActions
                    .filter(action => action.kind === InzhurOperationKindEnum.DIVIDEND || action.kind === InzhurOperationKindEnum.TAX)
                    .flatMap(action => {
                        const account = accountByFund.get(action.fundName ?? '');

                        return isDefined(account) ? [buildIncomeOrTaxInput(action, setup.cashAccount, account)] : [];
                    });

                for (const { stored } of amendedTrades) {
                    yield* transactionService.purgeById(stored.id);
                }

                const failedClaimFallbacks = yield* inzhurOperationsBankPairingService.apply(setup, pairing);

                yield* transactionService.bulkCreate([...placeholderInputs, ...failedClaimFallbacks, ...incomeInputs]);

                if (isNotEmptyArray(tradeInputs)) {
                    yield* transferCreationService.createSyncedTransfers(tradeInputs);
                }

                const coverageStart = DateTime.toDateUtc(
                    DateTime.makeUnsafe(
                        Math.min(setup.cashSync.backwardSyncedAt?.getTime() ?? plan.firstAt.getTime(), plan.firstAt.getTime())
                    )
                );
                const coverageEnd = DateTime.toDateUtc(
                    DateTime.makeUnsafe(Math.max(setup.cashSync.forwardSyncedAt?.getTime() ?? 0, plan.lastAt.getTime()))
                );
                yield* adjustOpeningCash(setup, coverageStart, coverageEnd);

                yield* syncRepository.update(setup.cashSync.id, {
                    backwardSyncedAt: coverageStart,
                    forwardSyncedAt: coverageEnd
                });

                const quantityOf = (action: InzhurPlannedActionInterface) =>
                    quantities.get(action.externalId) ?? { microUnits: 0, isEstimated: false };
                const sumFlow = (kind: InzhurOperationKindEnum) => {
                    const flows = plan.actions.filter(action => action.kind === kind);

                    return {
                        count: flows.length,
                        amount: convertFromMicroUnits(flows.reduce((sum, action) => sum + convertToMicroUnits(action.cashAmount), 0))
                    };
                };

                return {
                    periodFrom: toKyivDay(plan.firstAt),
                    periodTo: toKyivDay(plan.lastAt),
                    isFullHistory: plan.isFullHistory,
                    recordedCount: placeholderInputs.length + failedClaimFallbacks.length + incomeInputs.length + tradeInputs.length,
                    alreadyImportedCount: plan.actions.length - newActions.length - amendedTrades.length,
                    topUps: sumFlow(InzhurOperationKindEnum.TOP_UP),
                    withdrawals: sumFlow(InzhurOperationKindEnum.WITHDRAWAL),
                    funds: buildSummaryFunds(plan.actions, accountByFund, quantityOf),
                    conversionCount: plan.actions.filter(action => action.isConversion && action.kind === InzhurOperationKindEnum.SELL)
                        .length,
                    surchargeAmount: plan.surchargeAmount,
                    unrecognised: [
                        ...exported.unrecognised,
                        ...(isNotEmptyArray(plan.orphanSurcharges)
                            ? [{ operation: InzhurOperationKindEnum.SURCHARGE, count: plan.orphanSurcharges.length }]
                            : [])
                    ],
                    bankMatches: {
                        paired: pairing.paired - failedClaimFallbacks.length,
                        unpaired: pairing.unpaired + failedClaimFallbacks.length
                    },
                    replacedPurchaseCount: replacedPurchases.length,
                    unmatchedBankCount: pairing.unmatchedBankCount,
                    cashBalance: convertFromMicroUnits((yield* accountBalanceRepository.getByAccountId(cashAccountId)).at(0)?.balance ?? 0)
                } satisfies InzhurOperationsImportSummaryInterface;
            });

            return {
                importOperations: Effect.fn('InzhurOperationsImportService.importOperations')(function* (uri: string) {
                    const bytes = yield* syncFileReader.readBytes(uri);
                    const exported = yield* inzhurOperationsParser.parse(bytes);

                    const importWith = (prices: readonly InzhurFundPriceInterface[]) =>
                        Db.transaction(Effect.flatMap(inzhurSetupService.setup(), setup => run(setup, exported, prices)));

                    return yield* syncWorkload.runUser(
                        importWith([]).pipe(
                            Effect.catchTag('InzhurPriceMissingError', () =>
                                inzhurPriceService.fetchPrices.pipe(
                                    Effect.orElseSucceed(() => []),
                                    Effect.flatMap(importWith)
                                )
                            )
                        )
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurOperationsImportService, InzhurOperationsImportService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            SyncRepository.layer,
            TransactionRepository.layer,
            TransactionService.layer,
            TransferCreationService.layer,
            InzhurPriceService.layer,
            InzhurBankFlowService.layer,
            InzhurOpeningBalanceService.layer,
            InzhurOperationsBankPairingService.layer,
            InzhurFundAccountService.layer,
            InzhurSetupService.layer
        ])
    );
}
