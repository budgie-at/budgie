import {
    AccountBalanceRepository,
    Db,
    INVESTMENTS_CATEGORY_ID,
    InstrumentRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransactionService, TransferCreationService } from '@budgie/ledger';
import { InzhurPriceService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncFileReader } from '../../core/port/sync-file-reader.port';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { buildPrimaryEntry } from '../../core/utils/build-primary-entry.util';
import { INZHUR_BANK_DESCRIPTION_PATTERNS } from '../constant/inzhur-bank-description-patterns.constant';
import { INZHUR_BALANCE_CORRECTION_TITLE, INZHUR_OPENING_HOLDINGS_TITLE } from '../constant/inzhur-estimate-titles.constant';
import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { INZHUR_PAIRING_WINDOW_MILLISECONDS } from '../constant/inzhur-pairing-window.constant';
import { INZHUR_TAXES_CATEGORY_ID } from '../constant/inzhur-taxes-category-id.constant';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';
import { InzhurNotSetUpError } from '../error/inzhur-not-set-up.error';
import { InzhurPriceMissingError } from '../error/inzhur-price-missing.error';
import { inzhurOperationsParser } from '../parser/inzhur-operations.parser';
import { inzhurOperationsPlanner } from '../planner/inzhur-operations.planner';
import { inzhurQuantityResolver } from '../planner/inzhur-quantity.resolver';
import { buildInzhurTradeEntries } from '../utils/build-inzhur-trade-entries.util';
import { buildInzhurTransactionInput } from '../utils/build-inzhur-transaction-input.util';
import { sumSignedAccountEntries } from '../utils/sum-signed-account-entries.util';

import { InzhurBankFlowService } from './inzhur-bank-flow.service';
import { InzhurBeforeTrackingService } from './inzhur-before-tracking.service';
import { InzhurFundAccountService } from './inzhur-fund-account.service';
import { InzhurQuantityReconcileService } from './inzhur-quantity-reconcile.service';
import { InzhurSetupService } from './inzhur-setup.service';

import type { InzhurOperationsExportInterface } from '../interface/inzhur-operations-export.interface';
import type { InzhurOperationsFundSummaryInterface } from '../interface/inzhur-operations-fund-summary.interface';
import type { InzhurOperationsImportSummaryInterface } from '../interface/inzhur-operations-import-summary.interface';
import type { InzhurPlannedActionInterface } from '../interface/inzhur-planned-action.interface';
import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';
import type { AccountEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class InzhurOperationsImportService extends Context.Service<InzhurOperationsImportService>()(
    '@budgie/sync/InzhurOperationsImportService',
    {
        make: Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const transactionRepository = yield* TransactionRepository;
            const transactionService = yield* TransactionService;
            const transferCreationService = yield* TransferCreationService;
            const inzhurPriceService = yield* InzhurPriceService;
            const inzhurBankFlowService = yield* InzhurBankFlowService;
            const inzhurBeforeTrackingService = yield* InzhurBeforeTrackingService;
            const inzhurFundAccountService = yield* InzhurFundAccountService;
            const inzhurQuantityReconcileService = yield* InzhurQuantityReconcileService;
            const inzhurSetupService = yield* InzhurSetupService;
            const syncFileReader = yield* SyncFileReader;
            const syncWorkload = yield* SyncWorkload;
            const estimateIdPattern = /^inzhur:\d{4}-\d{2}-\d{2}:.+:(?:buy|sell|dividend)$/u;
            const actualBalanceIdPrefix = 'inzhur:actual-balance:';
            const endOfDaySuffix = 'T23:59:59.999Z';
            const millisecondsPerSecond = 1000;
            const topUpTitle = 'Top-up to Inzhur';
            const withdrawalTitle = 'Withdrawal from Inzhur';

            const toShortName = (name: string) => name.replace(/^Inzhur\s+/iu, '');

            const isSupersededEstimate = (transaction: TransactionWithEntriesEntityInterface, cutoff: Date | null) => {
                const { externalId, type, title, operatedAt } = transaction;
                const isEstimate =
                    (isDefined(externalId) && (estimateIdPattern.test(externalId) || externalId.startsWith(actualBalanceIdPrefix))) ||
                    (type === TransactionTypeEnum.ADJUSTMENT &&
                        (title === INZHUR_OPENING_HOLDINGS_TITLE || title === INZHUR_BALANCE_CORRECTION_TITLE));

                return isEstimate && (!isDefined(cutoff) || operatedAt >= cutoff);
            };

            const sumQuantity = (
                ledger: readonly TransactionWithEntriesEntityInterface[],
                accountId: number,
                isIncluded: (transaction: TransactionWithEntriesEntityInterface) => boolean
            ) => ledger.filter(isIncluded).reduce((sum, transaction) => sum + sumSignedAccountEntries(transaction.entries, accountId), 0);

            const findBankTransfer = (
                ledger: readonly TransactionWithEntriesEntityInterface[],
                action: InzhurPlannedActionInterface,
                cashAccountId: number,
                claimedIds: ReadonlySet<number>
            ) => {
                const entryType =
                    action.kind === InzhurOperationKindEnum.TOP_UP ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
                const amountMicroUnits = convertToMicroUnits(action.cashAmount);

                return (
                    [...ledger]
                        .filter(
                            transaction =>
                                transaction.type === TransactionTypeEnum.TRANSFER &&
                                !claimedIds.has(transaction.id) &&
                                INZHUR_BANK_DESCRIPTION_PATTERNS.externalSources.some(source => source === transaction.externalSource) &&
                                Math.abs(transaction.operatedAt.getTime() - action.occurredAt.getTime()) <=
                                    INZHUR_PAIRING_WINDOW_MILLISECONDS &&
                                transaction.entries.some(
                                    entry =>
                                        entry.accountId === cashAccountId && entry.type === entryType && entry.amount === amountMicroUnits
                                )
                        )
                        .sort(
                            (left, right) =>
                                Math.abs(left.operatedAt.getTime() - action.occurredAt.getTime()) -
                                Math.abs(right.operatedAt.getTime() - action.occurredAt.getTime())
                        )
                        .at(0) ?? null
                );
            };

            const buildSummaryFunds = (
                actions: readonly InzhurPlannedActionInterface[],
                accountByFund: ReadonlyMap<string, AccountEntityInterface>,
                quantityMicroUnits: (action: InzhurPlannedActionInterface) => { readonly microUnits: number; readonly isEstimated: boolean }
            ): InzhurOperationsFundSummaryInterface[] =>
                [...accountByFund].map(([name, account]) => {
                    const fundActions = actions.filter(action => action.fundName === name);
                    const total = (kind: InzhurOperationKindEnum, select: (action: InzhurPlannedActionInterface) => number) =>
                        fundActions.filter(action => action.kind === kind).reduce((sum, action) => sum + select(action), 0);
                    const quantityOf = (action: InzhurPlannedActionInterface) => quantityMicroUnits(action).microUnits;

                    return {
                        accountId: account.id,
                        name,
                        boughtQuantity: convertFromMicroUnits(total(InzhurOperationKindEnum.BUY, quantityOf)),
                        boughtAmount: convertFromMicroUnits(
                            total(InzhurOperationKindEnum.BUY, action => convertToMicroUnits(action.cashAmount))
                        ),
                        soldQuantity: convertFromMicroUnits(total(InzhurOperationKindEnum.SELL, quantityOf)),
                        soldAmount: convertFromMicroUnits(
                            total(InzhurOperationKindEnum.SELL, action => convertToMicroUnits(action.cashAmount))
                        ),
                        dividends: convertFromMicroUnits(
                            total(InzhurOperationKindEnum.DIVIDEND, action => convertToMicroUnits(action.cashAmount))
                        ),
                        tax: convertFromMicroUnits(total(InzhurOperationKindEnum.TAX, action => convertToMicroUnits(action.cashAmount))),
                        isQuantityEstimated: fundActions.some(
                            action => action.kind === InzhurOperationKindEnum.BUY && quantityMicroUnits(action).isEstimated
                        )
                    };
                });

            const buildIncomeOrTaxInput = (
                action: InzhurPlannedActionInterface,
                cashAccountId: number,
                fundAccount: AccountEntityInterface
            ) => {
                const isDividend = action.kind === InzhurOperationKindEnum.DIVIDEND;
                const entry = {
                    ...buildPrimaryEntry(
                        cashAccountId,
                        isDividend ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                        action.cashAmount,
                        action.externalId
                    ),
                    categoryId: isDividend ? INVESTMENTS_CATEGORY_ID : INZHUR_TAXES_CATEGORY_ID
                };
                const title = `${toShortName(fundAccount.title)} ${isDividend ? 'dividends' : 'dividend tax'}`;

                return {
                    ...buildInzhurTransactionInput(title, action.externalId, action.occurredAt, [entry]),
                    fundAccountId: fundAccount.id
                };
            };

            const buildFlowInput = (action: InzhurPlannedActionInterface, cashAccountId: number) => {
                const isTopUp = action.kind === InzhurOperationKindEnum.TOP_UP;
                const entry = buildPrimaryEntry(
                    cashAccountId,
                    isTopUp ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                    action.cashAmount,
                    action.externalId
                );

                return {
                    ...buildInzhurTransactionInput(isTopUp ? topUpTitle : withdrawalTitle, action.externalId, action.occurredAt, [entry]),
                    type: TransactionTypeEnum.TRANSFER
                };
            };

            const readPriceMap = Effect.fnUntraced(function* (
                actions: readonly InzhurPlannedActionInterface[],
                accountByFund: ReadonlyMap<string, AccountEntityInterface>
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
                            action.occurredAt.toISOString().slice(0, 10)
                        ),
                        price => [action.externalId, price] as const
                    )
                );

                return new Map(entries.flatMap(([externalId, price]) => (isDefined(price) ? [[externalId, price] as const] : [])));
            });

            const adjustOpeningCash = Effect.fnUntraced(function* (
                setup: InzhurSetupInterface,
                firstAt: Date,
                fundAccountIds: readonly number[]
            ) {
                const cashAccountId = setup.cashAccount.id;
                const openingAt = new Date(firstAt.getTime() - millisecondsPerSecond);

                yield* inzhurBeforeTrackingService.moveTo(cashAccountId, openingAt);

                const cashLedger = yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId]);
                let running = 0;
                let minimum = 0;

                for (const transaction of cashLedger) {
                    running += sumSignedAccountEntries(transaction.entries, cashAccountId);
                    minimum = Math.min(minimum, running);
                }

                if (minimum < 0) {
                    yield* inzhurBeforeTrackingService.shift(cashAccountId, -minimum, fundAccountIds);
                    yield* inzhurBeforeTrackingService.moveTo(cashAccountId, openingAt);
                }
            });

            const run = Effect.fnUntraced(function* (setup: InzhurSetupInterface, exported: InzhurOperationsExportInterface) {
                const plan = inzhurOperationsPlanner.plan(exported.operations);
                const cashAccountId = setup.cashAccount.id;

                yield* inzhurBankFlowService.convert(setup, null);

                const accountByFund = new Map<string, AccountEntityInterface>();

                for (const name of new Set(plan.actions.flatMap(action => (isDefined(action.fundName) ? [action.fundName] : [])))) {
                    accountByFund.set(name, yield* inzhurFundAccountService.ensureByName(setup, name));
                }

                const fundAccountIds = [
                    ...new Set([
                        ...setup.fundAccounts.map(account => account.id),
                        ...[...accountByFund.values()].map(account => account.id)
                    ])
                ];
                const before = yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId, ...fundAccountIds]);
                const hasPriorOperations = before.some(transaction =>
                    transaction.externalId?.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX)
                );
                const statementCutoff = isDefined(setup.lastStatementDate) ? new Date(`${setup.lastStatementDate}${endOfDaySuffix}`) : null;
                const statementMicroUnitsByAccountId = new Map(
                    isDefined(statementCutoff)
                        ? fundAccountIds.map(accountId => [
                              accountId,
                              sumQuantity(before, accountId, transaction => transaction.operatedAt <= statementCutoff)
                          ])
                        : []
                );
                const estimates = before.filter(transaction => isSupersededEstimate(transaction, plan.isFullHistory ? null : plan.firstAt));

                for (const estimate of estimates) {
                    yield* transactionService.deleteById(estimate.id);
                }

                const ledger = isNotEmptyArray(estimates)
                    ? yield* transactionRepository.findByAccountIdsWithEntries([cashAccountId, ...fundAccountIds])
                    : before;
                const existingIds = new Set(
                    ledger.flatMap(transaction => (isDefined(transaction.externalId) ? [transaction.externalId] : []))
                );
                const newActions = plan.actions.filter(action => !existingIds.has(action.externalId));
                const quantities = inzhurQuantityResolver.resolve({
                    actions: plan.actions,
                    baseMicroUnitsByFund: new Map(
                        [...accountByFund].map(([name, account]) => [
                            name,
                            sumQuantity(ledger, account.id, transaction => transaction.operatedAt < plan.firstAt)
                        ])
                    ),
                    statementMicroUnitsByFund: new Map(
                        [...accountByFund].flatMap(([name, account]) => {
                            const quantity = statementMicroUnitsByAccountId.get(account.id);

                            return isDefined(quantity) ? [[name, quantity] as const] : [];
                        })
                    ),
                    statementCutoff,
                    priceByExternalId: yield* readPriceMap(plan.actions, accountByFund)
                });
                const isTrade = (action: InzhurPlannedActionInterface) =>
                    action.kind === InzhurOperationKindEnum.BUY || action.kind === InzhurOperationKindEnum.SELL;
                const unresolvedFundNames = newActions
                    .filter(action => isTrade(action) && !quantities.has(action.externalId))
                    .flatMap(action => (isDefined(action.fundName) ? [action.fundName] : []));

                if (isNotEmptyArray(unresolvedFundNames)) {
                    return yield* new InzhurPriceMissingError({ fundNames: [...new Set(unresolvedFundNames)] });
                }

                const claimedBankIds = new Set<number>();
                let paired = 0;
                let unpaired = 0;
                const placeholderInputs = [];

                for (const action of plan.actions.filter(
                    item => item.kind === InzhurOperationKindEnum.TOP_UP || item.kind === InzhurOperationKindEnum.WITHDRAWAL
                )) {
                    const bankTransfer = existingIds.has(action.externalId)
                        ? null
                        : findBankTransfer(ledger, action, cashAccountId, claimedBankIds);

                    if (isDefined(bankTransfer)) {
                        claimedBankIds.add(bankTransfer.id);
                        paired += 1;
                    } else {
                        unpaired += 1;

                        if (!existingIds.has(action.externalId)) {
                            placeholderInputs.push(buildFlowInput(action, cashAccountId));
                        }
                    }
                }

                const tradeInputs = newActions.filter(isTrade).flatMap(action => {
                    const account = accountByFund.get(action.fundName ?? '');
                    const quantity = quantities.get(action.externalId);

                    if (!isDefined(account) || !isDefined(quantity)) {
                        return [];
                    }

                    const isSell = action.kind === InzhurOperationKindEnum.SELL;

                    return [
                        buildInzhurTransactionInput(
                            `${isSell ? 'Sold' : 'Bought'} ${toShortName(account.title)}`,
                            action.externalId,
                            action.occurredAt,
                            buildInzhurTradeEntries({
                                isSell,
                                externalId: action.externalId,
                                cashAccountId,
                                fundAccountId: account.id,
                                cashAmount: action.cashAmount,
                                quantity: convertFromMicroUnits(quantity.microUnits)
                            })
                        )
                    ];
                });
                const incomeInputs = newActions
                    .filter(action => action.kind === InzhurOperationKindEnum.DIVIDEND || action.kind === InzhurOperationKindEnum.TAX)
                    .flatMap(action => {
                        const account = accountByFund.get(action.fundName ?? '');

                        return isDefined(account) ? [buildIncomeOrTaxInput(action, cashAccountId, account)] : [];
                    });

                yield* transactionService.bulkCreate([...placeholderInputs, ...incomeInputs]);

                if (isNotEmptyArray(tradeInputs)) {
                    yield* transferCreationService.createSyncedTransfers(tradeInputs);
                }

                if (plan.isFullHistory) {
                    yield* inzhurBeforeTrackingService.replace(cashAccountId, 0);
                } else if (!hasPriorOperations) {
                    yield* adjustOpeningCash(setup, plan.firstAt, fundAccountIds);
                }

                const reconciliations = isDefined(setup.lastStatementDate)
                    ? yield* inzhurQuantityReconcileService.reconcile(
                          setup.lastStatementDate,
                          new Map(
                              [...statementMicroUnitsByAccountId].map(([accountId, microUnits]) => [
                                  accountId,
                                  convertFromMicroUnits(microUnits)
                              ])
                          )
                      )
                    : [];
                const instruments = yield* instrumentRepository.getAll();
                const nameByAccountId = new Map(
                    [...setup.fundAccounts, ...accountByFund.values()].map(account => [
                        account.id,
                        instruments.find(instrument => instrument.id === account.instrumentId)?.name ?? account.title
                    ])
                );
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
                    periodFrom: plan.firstAt.toISOString().slice(0, 10),
                    periodTo: plan.lastAt.toISOString().slice(0, 10),
                    isFullHistory: plan.isFullHistory,
                    recordedCount: placeholderInputs.length + incomeInputs.length + tradeInputs.length,
                    alreadyImportedCount: plan.actions.length - newActions.length,
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
                    bankMatches: { paired, unpaired },
                    reconciliations: reconciliations.map(({ accountId, difference }) => ({
                        fundName: nameByAccountId.get(accountId) ?? '',
                        difference
                    })),
                    removedEstimateCount: estimates.length,
                    cashBalance: convertFromMicroUnits((yield* accountBalanceRepository.getByAccountId(cashAccountId)).at(0)?.balance ?? 0)
                } satisfies InzhurOperationsImportSummaryInterface;
            });

            return {
                importOperations: Effect.fn('InzhurOperationsImportService.importOperations')(function* (uri: string) {
                    const bytes = yield* syncFileReader.readBytes(uri);
                    const exported = yield* inzhurOperationsParser.parse(bytes);
                    const setup = yield* inzhurSetupService.findSetup();

                    if (!isDefined(setup)) {
                        return yield* new InzhurNotSetUpError();
                    }

                    return yield* syncWorkload.runUser(Db.transaction(run(setup, exported)));
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(InzhurOperationsImportService, InzhurOperationsImportService.make).pipe(
        Layer.provide([
            AccountBalanceRepository.layer,
            InstrumentRepository.layer,
            TransactionRepository.layer,
            TransactionService.layer,
            TransferCreationService.layer,
            InzhurPriceService.layer,
            InzhurBankFlowService.layer,
            InzhurBeforeTrackingService.layer,
            InzhurFundAccountService.layer,
            InzhurQuantityReconcileService.layer,
            InzhurSetupService.layer
        ])
    );
}
