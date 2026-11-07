import { ConsolidationExecutorService } from '@budgie/consolidation';
import {
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

import { ownTransferDetector } from '../detector/own-transfer.detector';
import { OwnTransferRepository } from '../repository/own-transfer.repository';

import { ExternalAccountService } from './external-account.service';

import type { TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class OwnTransferRepairService extends Context.Service<OwnTransferRepairService>()('@budgie/sync/OwnTransferRepairService', {
    make: Effect.gen(function* () {
        const repository = yield* OwnTransferRepository;
        const transfers = yield* TransactionTransferService;
        const consolidation = yield* ConsolidationExecutorService;
        const externalAccounts = yield* ExternalAccountService;
        const balances = yield* AccountBalanceIncrementalService;

        const primaryEntry = (transaction: TransactionWithEntriesEntityInterface) =>
            transaction.entries.filter(
                entry => entry.type !== TransactionEntryTypeEnum.FEE && !isDefined(entry.categoryId) && isPositiveNumber(entry.amount)
            );

        const pair = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            counterpart: TransactionWithEntriesEntityInterface
        ) {
            const expense = transaction.type === TransactionTypeEnum.EXPENSE ? transaction : counterpart;
            const income = transaction.type === TransactionTypeEnum.INCOME ? transaction : counterpart;
            const [credit] = primaryEntry(expense);
            const [debit] = primaryEntry(income);

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
            repair: Effect.fn('OwnTransferRepairService.repair')(function* () {
                const accounts = yield* repository.findAccounts;
                const identities = (yield* repository.findIdentities).map(identity => identity.label).filter(isNotEmptyString);
                const transactions = (yield* repository.findTransactions).filter(
                    transaction =>
                        primaryEntry(transaction).length === 1 &&
                        transaction.entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE).length === 1
                );
                const candidates = transactions.flatMap(transaction => {
                    const [entry] = primaryEntry(transaction);
                    const account = accounts.find(candidate => candidate.id === entry.accountId && !isDefined(candidate.deletedAt));
                    const matches = accounts.filter(
                        candidate => candidate.id !== entry.accountId && ownTransferDetector.matchesAccount(transaction.title, candidate)
                    );
                    const isCryptoMovement =
                        transaction.externalSource === ExternalSourceEnum.BINANCE &&
                        /^Binance \S+ (deposit|withdrawal)$/u.test(transaction.title);

                    return isDefined(account) &&
                        (matches.length === 1 || ownTransferDetector.matches(transaction.title, identities) || isCryptoMovement)
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

                        for (const { transaction, account, matches } of candidates) {
                            const [entry] = primaryEntry(transaction);

                            if (!consumed.has(transaction.id)) {
                                const counterparts = transactions.filter(candidate => {
                                    const [counterEntry] = primaryEntry(candidate);
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

                                if (counterparts.length === 1 && (yield* pair(transaction, counterparts[0]))) {
                                    consumed.add(counterparts[0].id);
                                } else {
                                    const target =
                                        matches.length === 1
                                            ? matches[0]
                                            : yield* externalAccounts.getUntrackedOwnAccount(account.instrumentId);
                                    yield* transfers.convertToTransferAccount(transaction.id, target.id);
                                }
                                consumed.add(transaction.id);
                                repaired += 1;
                                yield* YIELD_TO_UI;
                            }
                        }

                        if (isPositiveNumber(repaired)) {
                            yield* balances.updateAllBalances(true);
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
            ExternalAccountService.layer,
            AccountBalanceIncrementalService.layer
        ])
    );
}
