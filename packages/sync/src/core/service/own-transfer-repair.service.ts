import { ConsolidationExecutorService } from '@budgie/consolidation';
import {
    AccountNatureEnum,
    AccountRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    Db,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionTransferService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isBinanceOwnTransferTitle } from '../../binance/mapper/binance.mapper';
import { ownTransferDetector } from '../detector/own-transfer.detector';
import { OwnTransferRepository } from '../repository/own-transfer.repository';
import { isInitialSyncIncomplete } from '../utils/is-initial-sync-incomplete.util';

import type { AccountEntityInterface, ConsolidationScanScopeInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class OwnTransferRepairService extends Context.Service<OwnTransferRepairService>()('@budgie/sync/OwnTransferRepairService', {
    make: Effect.gen(function* () {
        const repository = yield* OwnTransferRepository;
        const transfers = yield* TransactionTransferService;
        const consolidation = yield* ConsolidationExecutorService;
        const balances = yield* AccountBalanceIncrementalService;
        const accountRepository = yield* AccountRepository;

        const candidateEntries = (transaction: TransactionWithEntriesEntityInterface) =>
            transaction.entries.filter(
                entry =>
                    entry.type !== TransactionEntryTypeEnum.FEE &&
                    (!isDefined(entry.categoryId) ||
                        entry.categorySource === CategorySourceEnum.MCC_DEFAULT ||
                        entry.categorySource === CategorySourceEnum.AI) &&
                    isPositiveNumber(entry.amount)
            );

        const isSingleEntry = (transaction: TransactionWithEntriesEntityInterface) =>
            candidateEntries(transaction).length === 1 &&
            transaction.entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE).length === 1;

        const getUntrackedOwnAccount = Effect.fnUntraced(function* (instrumentId: number) {
            const externalId = UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID;
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
                const cardMatches = (transaction: TransactionWithEntriesEntityInterface) =>
                    accounts.filter(
                        candidate =>
                            candidate.id !== candidateEntries(transaction)[0].accountId &&
                            ownTransferDetector.matchesAccount(transaction.title, candidate)
                    );
                const isCompatible = (matches: readonly AccountEntityInterface[], accountId: number) =>
                    isEmptyArray(matches) || matches.some(match => match.id === accountId);
                const identities = (yield* repository.findIdentities).map(identity => identity.label).filter(isNotEmptyString);
                const syncs = yield* repository.findLiveSyncs;
                const isSettled = (operatedAt: Date) =>
                    syncs.every(
                        sync =>
                            !isInitialSyncIncomplete(sync) &&
                            isDefined(sync.forwardSyncFromAt) &&
                            sync.forwardSyncFromAt.getTime() >= operatedAt.getTime() + TRANSFER_PAIR_TIME_WINDOW_SECONDS * 1000
                    );
                const isUntrackedMovement = (transaction: TransactionWithEntriesEntityInterface, isFiat: boolean) =>
                    transaction.externalSource === ExternalSourceEnum.BINANCE
                        ? isBinanceOwnTransferTitle(transaction.title) && transaction.type === TransactionTypeEnum.INCOME && isFiat
                        : ownTransferDetector.matches(transaction.title, identities) ||
                          ownTransferDetector.matchesAbbreviatedName(transaction.title, identities);
                const transactions = (yield* repository.findTransactions(scope)).filter(isSingleEntry);
                const candidates = transactions.flatMap(transaction => {
                    const [entry] = candidateEntries(transaction);
                    const account = accounts.find(candidate => candidate.id === entry.accountId);
                    const matches = cardMatches(transaction);
                    const isCryptoMovement =
                        transaction.externalSource === ExternalSourceEnum.BINANCE && isBinanceOwnTransferTitle(transaction.title);

                    return isDefined(account) &&
                        (isNotEmptyArray(matches) ||
                            ownTransferDetector.matches(transaction.title, identities) ||
                            ownTransferDetector.matchesAbbreviatedName(transaction.title, identities) ||
                            isCryptoMovement)
                        ? [{ transaction, account, matches }]
                        : [];
                });

                if (isEmptyArray(candidates)) {
                    return 0;
                }

                const opposites = yield* repository.findOpposites(candidates.map(candidate => candidate.transaction.id));
                const eligibleOpposites = (yield* repository.findTransactions(
                    null,
                    opposites.map(link => link.oppositeId)
                )).filter(isSingleEntry);
                const reverseOpposites = yield* repository.findOpposites(opposites.map(link => link.oppositeId));
                const decisions = candidates
                    .map(({ transaction, account, matches }) => {
                        const links = opposites.filter(link => link.transactionId === transaction.id);
                        const counterpart = eligibleOpposites.find(candidate => candidate.id === links[0]?.oppositeId);

                        if (
                            links.length === 1 &&
                            isDefined(counterpart) &&
                            reverseOpposites.filter(link => link.transactionId === counterpart.id).length === 1 &&
                            isCompatible(matches, candidateEntries(counterpart)[0].accountId) &&
                            isCompatible(cardMatches(counterpart), account.id)
                        ) {
                            return { transaction, counterpart, target: null, untrackedInstrumentId: null };
                        }
                        if (
                            isEmptyArray(links) &&
                            matches.length === 1 &&
                            !isDefined(matches[0].integrationId) &&
                            !isDefined(matches[0].externalSource) &&
                            matches[0].instrumentId === account.instrumentId
                        ) {
                            return { transaction, counterpart: null, target: matches[0], untrackedInstrumentId: null };
                        }
                        if (
                            isEmptyArray(links) &&
                            isEmptyArray(matches) &&
                            isUntrackedMovement(transaction, account.instrument.type === InstrumentTypeEnum.FIAT) &&
                            isSettled(transaction.operatedAt)
                        ) {
                            return { transaction, counterpart: null, target: null, untrackedInstrumentId: account.instrumentId };
                        }

                        return null;
                    })
                    .filter(isDefined);

                return yield* Db.transaction(
                    Effect.gen(function* () {
                        const consumed = new Set<number>();
                        let repaired = 0;

                        for (const { transaction, counterpart, target, untrackedInstrumentId } of decisions) {
                            if (!consumed.has(transaction.id)) {
                                const destination = isDefined(untrackedInstrumentId)
                                    ? yield* getUntrackedOwnAccount(untrackedInstrumentId)
                                    : target;
                                const changed = isDefined(counterpart)
                                    ? yield* pair(transaction, counterpart)
                                    : isDefined(destination) && (yield* transfers.convertToTransferAccount(transaction.id, destination.id));

                                if (changed) {
                                    consumed.add(transaction.id);
                                    if (isDefined(counterpart)) {
                                        consumed.add(counterpart.id);
                                    }
                                    yield* balances.updateBalancesByAccountIds([
                                        candidateEntries(transaction)[0].accountId,
                                        ...(isDefined(counterpart) ? [candidateEntries(counterpart)[0].accountId] : []),
                                        ...(isDefined(destination) ? [destination.id] : [])
                                    ]);
                                    repaired += 1;
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
            AccountBalanceIncrementalService.layer,
            AccountRepository.layer
        ])
    );
}
