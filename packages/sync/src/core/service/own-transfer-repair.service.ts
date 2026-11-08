import { ConsolidationExecutorService } from '@budgie/consolidation';
import {
    AccountNatureEnum,
    AccountRepository,
    AccountTypeEnum,
    CategorySourceEnum,
    Db,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionTransferService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isBinanceOwnTransferTitle } from '../../binance/mapper/binance.mapper';
import { ownTransferDetector } from '../detector/own-transfer.detector';
import { OwnTransferRepository } from '../repository/own-transfer.repository';

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
            const existing = (yield* accountRepository.findByExternalIds([UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID])).find(
                account => account.instrumentId === instrumentId
            );

            if (isDefined(existing)) {
                return existing;
            }

            return yield* accountRepository.create({
                title: 'Untracked own account',
                externalId: UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID,
                instrumentId,
                type: AccountTypeEnum.BANK,
                nature: AccountNatureEnum.ASSET,
                icon: UserIconNameEnum.Wallet,
                order: 0,
                includeInNetWorth: false,
                isActive: false
            });
        });

        const pair = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface,
            counterpart: TransactionWithEntriesEntityInterface
        ) {
            const isExpense = candidateEntries(transaction)[0].type === TransactionEntryTypeEnum.CREDIT;
            const expense = isExpense ? transaction : counterpart;
            const income = isExpense ? counterpart : transaction;
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
                const reservedAccounts = (yield* accountRepository.findByExternalIds([UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID])).filter(
                    account => account.isActive || account.includeInNetWorth
                );
                if (isNotEmptyArray(reservedAccounts)) {
                    yield* Db.transaction(
                        Effect.gen(function* () {
                            for (const account of reservedAccounts) {
                                yield* accountRepository.updateById(account.id, { isActive: false, includeInNetWorth: false });
                            }
                        })
                    );
                }
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
                const hasOwnSignal = (transaction: TransactionWithEntriesEntityInterface, matches = cardMatches(transaction)) =>
                    isNotEmptyArray(matches) ||
                    ownTransferDetector.matches(transaction.title, identities) ||
                    ownTransferDetector.matchesAbbreviatedName(transaction.title, identities) ||
                    (transaction.externalSource === ExternalSourceEnum.BINANCE && isBinanceOwnTransferTitle(transaction.title));
                const transactions = (yield* repository.findTransactions(scope)).filter(isSingleEntry);
                const candidates = transactions.flatMap(transaction => {
                    const [entry] = candidateEntries(transaction);
                    const account = accounts.find(candidate => candidate.id === entry.accountId);
                    const matches = cardMatches(transaction);
                    const ownSignal = hasOwnSignal(transaction, matches);
                    const canFallback =
                        transaction.externalSource === ExternalSourceEnum.BINANCE
                            ? isBinanceOwnTransferTitle(transaction.title) &&
                              transaction.type === TransactionTypeEnum.INCOME &&
                              account?.instrument.type === InstrumentTypeEnum.FIAT
                            : ownSignal;

                    return isDefined(account) && ownSignal ? [{ transaction, account, matches, canFallback }] : [];
                });

                const untrackedTransfers = (yield* repository.findUntrackedTransfers(scope)).filter(isSingleEntry);

                if (isEmptyArray(candidates) && isEmptyArray(untrackedTransfers)) {
                    return 0;
                }

                const findPlausibleOpposites = Effect.fnUntraced(function* (sources: TransactionWithEntriesEntityInterface[]) {
                    const links = yield* repository.findOpposites(sources.map(transaction => transaction.id));
                    const eligible = (yield* repository.findTransactions(
                        null,
                        links.map(link => link.oppositeId)
                    )).filter(isSingleEntry);

                    return {
                        eligible,
                        links: links.filter(link => {
                            const opposite = eligible.find(transaction => transaction.id === link.oppositeId);
                            const source = sources.find(transaction => transaction.id === link.transactionId);

                            return (
                                isDefined(opposite) &&
                                isDefined(source) &&
                                (accounts.find(account => account.id === candidateEntries(opposite)[0].accountId)?.instrumentId ===
                                    accounts.find(account => account.id === candidateEntries(source)[0].accountId)?.instrumentId ||
                                    hasOwnSignal(opposite))
                            );
                        })
                    };
                });
                const foundOpposites = yield* findPlausibleOpposites([
                    ...candidates.map(candidate => candidate.transaction),
                    ...untrackedTransfers
                ]);
                const opposites = foundOpposites.links;
                const eligibleOpposites = foundOpposites.eligible;
                const reverseOpposites = (yield* findPlausibleOpposites(eligibleOpposites)).links;
                const competingUntrackedTransfers = isEmptyArray(eligibleOpposites)
                    ? []
                    : (yield* repository.findUntrackedTransfers({
                          operatedAtFrom: DateTime.toDateUtc(
                              DateTime.makeUnsafe(Math.min(...eligibleOpposites.map(transaction => transaction.operatedAt.getTime())))
                          ),
                          operatedAtTo: DateTime.toDateUtc(
                              DateTime.makeUnsafe(Math.max(...eligibleOpposites.map(transaction => transaction.operatedAt.getTime())))
                          ),
                          transactionIds: []
                      })).filter(isSingleEntry);
                const untrackedOpposites = (yield* findPlausibleOpposites(competingUntrackedTransfers)).links;
                const decisions = [
                    ...untrackedTransfers.flatMap(transaction => {
                        const account = accounts.find(candidate => candidate.id === candidateEntries(transaction)[0].accountId);

                        return isDefined(account) ? [{ transaction, account, matches: cardMatches(transaction), canFallback: false }] : [];
                    }),
                    ...candidates
                ]
                    .map(({ transaction, account, matches, canFallback }) => {
                        const links = opposites.filter(link => link.transactionId === transaction.id);
                        const counterpart = eligibleOpposites.find(candidate => candidate.id === links[0]?.oppositeId);
                        const competitors = new Set([
                            ...reverseOpposites.filter(link => link.transactionId === counterpart?.id).map(link => link.oppositeId),
                            ...untrackedOpposites.filter(link => link.oppositeId === counterpart?.id).map(link => link.transactionId)
                        ]);

                        if (
                            links.length === 1 &&
                            isDefined(counterpart) &&
                            isDefined(counterpart.externalSource) &&
                            competitors.size === 1 &&
                            competitors.has(transaction.id) &&
                            (transaction.type === TransactionTypeEnum.TRANSFER ||
                                (account.instrumentId ===
                                    accounts.find(candidate => candidate.id === candidateEntries(counterpart)[0].accountId)?.instrumentId &&
                                    Math.abs(candidateEntries(transaction)[0].amount - candidateEntries(counterpart)[0].amount) <=
                                        PRECISION / 100)) &&
                            isCompatible(matches, candidateEntries(counterpart)[0].accountId) &&
                            isCompatible(cardMatches(counterpart), account.id)
                        ) {
                            return { transaction, counterpart, target: null, untrackedInstrumentId: null };
                        }
                        if (transaction.type === TransactionTypeEnum.TRANSFER) {
                            return null;
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
                        if (isEmptyArray(links) && isEmptyArray(matches) && canFallback) {
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
                                        ...(isDefined(destination) ? [destination.id] : []),
                                        ...untrackedTransfers
                                            .filter(transfer => transfer.id === transaction.id)
                                            .map(transfer => transfer.untrackedAccountId)
                                            .filter(isDefined)
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
