import { ConsolidationExecutorService } from '@budgie/consolidation';
import {
    AccountRepository,
    AccountTypeEnum,
    AccountNatureEnum,
    UserIconNameEnum,
    CategorySourceEnum,
    Db,
    ExternalSourceEnum,
    PRECISION,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    YIELD_TO_UI
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionTransferService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isBinanceOwnTransferTitle } from '../../binance/mapper/binance.mapper';
import { ownTransferDetector } from '../detector/own-transfer.detector';
import { OwnTransferRepository } from '../repository/own-transfer.repository';

import type { AccountEntityInterface, ConsolidationScanScopeInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class OwnTransferRepairService extends Context.Service<OwnTransferRepairService>()('@budgie/sync/OwnTransferRepairService', {
    make: Effect.gen(function* () {
        const repository = yield* OwnTransferRepository;
        const transfers = yield* TransactionTransferService;
        const consolidation = yield* ConsolidationExecutorService;
        const accountRepository = yield* AccountRepository;
        const balances = yield* AccountBalanceIncrementalService;

        const candidateEntries = (transaction: TransactionWithEntriesEntityInterface) =>
            transaction.entries.filter(
                entry =>
                    entry.type !== TransactionEntryTypeEnum.FEE &&
                    (!isDefined(entry.categoryId) ||
                        entry.categorySource === CategorySourceEnum.MCC_DEFAULT ||
                        entry.categorySource === CategorySourceEnum.AI) &&
                    isPositiveNumber(entry.amount)
            );

        const getUntrackedOwnAccount = Effect.fnUntraced(function* (instrumentId: number) {
            const externalId = 'untracked-own-account';
            const existing = (yield* accountRepository.findByExternalIds([externalId])).find(
                account => account.instrumentId === instrumentId
            );

            return (
                existing ??
                (yield* accountRepository.create({
                    title: 'Untracked own account',
                    externalId,
                    instrumentId,
                    type: AccountTypeEnum.BANK,
                    nature: AccountNatureEnum.ASSET,
                    icon: UserIconNameEnum.Wallet,
                    order: 0,
                    includeInNetWorth: false,
                    isActive: false
                }))
            );
        });

        const pair = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            counterpart: TransactionWithEntriesEntityInterface
        ) {
            const expense = transaction.type === TransactionTypeEnum.EXPENSE ? transaction : counterpart;
            const income = transaction.type === TransactionTypeEnum.INCOME ? transaction : counterpart;
            const [credit] = candidateEntries(expense);
            const [debit] = candidateEntries(income);

            return yield* consolidation.consolidateTransfer({
                sourceTransactionIds: [expense.id, income.id],
                allowedMovedSourceTransactionIds: [],
                canonicalInput: {
                    title: expense.title,
                    operatedAt: Math.floor(expense.operatedAt.getTime() / 1000),
                    fromAccountId: credit.accountId,
                    toAccountId: debit.accountId,
                    fromAmount: credit.amount,
                    toAmount: debit.amount,
                    exchangeRate: credit.amount / debit.amount,
                    consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                    fromEntryExchangeRate: credit.exchangeRate,
                    toEntryExchangeRate: debit.exchangeRate,
                    fromEntryToIban: credit.toIban
                }
            });
        });

        return {
            repair: Effect.fn('OwnTransferRepairService.repair')(function* (scope: ConsolidationScanScopeInterface | null = null) {
                const accounts = yield* repository.findAccounts;
                const identities = (yield* repository.findIdentities).map(identity => identity.label).filter(isNotEmptyString);
                const transactions = (yield* repository.findTransactions(scope)).filter(
                    transaction =>
                        candidateEntries(transaction).length === 1 &&
                        transaction.entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE).length === 1
                );
                const candidates = transactions.flatMap(transaction => {
                    const [entry] = candidateEntries(transaction);
                    const account = accounts.find(candidate => candidate.id === entry.accountId);
                    const matches = accounts.filter(
                        candidate => candidate.id !== entry.accountId && ownTransferDetector.matchesAccount(transaction.title, candidate)
                    );
                    const isCryptoMovement =
                        transaction.externalSource === ExternalSourceEnum.BINANCE && isBinanceOwnTransferTitle(transaction.title);

                    return isDefined(account) &&
                        (matches.length === 1 ||
                            ownTransferDetector.matches(transaction.title, identities) ||
                            ownTransferDetector.matchesAbbreviatedName(transaction.title, identities) ||
                            isCryptoMovement)
                        ? [{ transaction, account, matches }]
                        : [];
                });

                if (isEmptyArray(candidates)) {
                    return 0;
                }

                return yield* Db.transaction(
                    Effect.gen(function* () {
                        const consumed = new Set<number>();
                        let repaired = 0;

                        const repairCandidate = Effect.fnUntraced(function* (
                            transaction: TransactionWithEntriesEntityInterface,
                            account: AccountEntityInterface,
                            matches: AccountEntityInterface[],
                            counterparts: TransactionWithEntriesEntityInterface[]
                        ) {
                            if (counterparts.length > 1) {
                                return false;
                            }

                            if (counterparts.length === 1) {
                                if (!(yield* pair(transaction, counterparts[0]))) {
                                    return false;
                                }
                                yield* balances.updateBalancesByAccountIds([
                                    candidateEntries(transaction)[0].accountId,
                                    candidateEntries(counterparts[0])[0].accountId
                                ]);
                                consumed.add(counterparts[0].id);
                            } else {
                                if (
                                    ownTransferDetector.matchesAbbreviatedName(transaction.title, identities) &&
                                    !ownTransferDetector.matches(transaction.title, identities)
                                ) {
                                    return false;
                                }
                                if (matches.length === 1 && isDefined(matches[0].integrationId)) {
                                    return false;
                                }
                                const target = matches.length === 1 ? matches[0] : yield* getUntrackedOwnAccount(account.instrumentId);
                                if (!(yield* transfers.convertToTransferAccount(transaction.id, target.id))) {
                                    return false;
                                }
                            }

                            return true;
                        });

                        for (const { transaction, account, matches } of candidates) {
                            const [entry] = candidateEntries(transaction);

                            if (!consumed.has(transaction.id)) {
                                const counterparts = transactions.filter(candidate => {
                                    const [counterEntry] = candidateEntries(candidate);
                                    const counterAccount = accounts.find(own => own.id === counterEntry.accountId);

                                    return (
                                        !consumed.has(candidate.id) &&
                                        candidate.type !== transaction.type &&
                                        counterEntry.accountId !== entry.accountId &&
                                        isDefined(counterAccount) &&
                                        counterAccount.instrumentId === account.instrumentId &&
                                        (matches.length !== 1 || counterEntry.accountId === matches[0].id) &&
                                        Math.abs(candidate.operatedAt.getTime() - transaction.operatedAt.getTime()) <=
                                            TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000 &&
                                        Math.abs(counterEntry.amount - entry.amount) <= PRECISION / 100
                                    );
                                });

                                const changed = yield* repairCandidate(transaction, account, matches, counterparts);

                                if (changed) {
                                    consumed.add(transaction.id);
                                    repaired += 1;
                                    yield* YIELD_TO_UI;
                                }
                            }
                        }

                        return repaired;
                    })
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(OwnTransferRepairService, OwnTransferRepairService.make).pipe(
        Layer.provide([
            OwnTransferRepository.layer,
            TransactionTransferService.layer,
            ConsolidationExecutorService.layer,
            AccountRepository.layer,
            AccountBalanceIncrementalService.layer
        ])
    );
}
