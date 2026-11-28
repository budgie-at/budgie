import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    BANK_EXTERNAL_SOURCES,
    CategorySourceEnum,
    Db,
    LanguageEnum,
    PRECISION,
    SettingsRepository,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionYieldRepository,
    YieldKindEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { min } from 'date-fns/min';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Order from 'effect/Order';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { TransactionTransferService } from '../../transaction/service/transaction-transfer.service';
import { TransferCreationService } from '../../transaction/service/transfer-creation.service';
import { buildTransferEntries } from '../../transaction/utils/build-transfer-entries.util';
import { createTransactionInput } from '../../transaction/utils/create-transaction-input.util';
import { getTransactionCategoryEntries } from '../../transaction/utils/get-transaction-category-entries.util';
import { DepositNegativeBalanceError } from '../error/deposit-negative-balance.error';

import { AccountBalanceIncrementalService } from './account-balance-incremental.service';
import { AccountService } from './account.service';
import { DepositInterestService } from './deposit-interest.service';

import type { DepositPayoutCandidateInterface } from '../interface/deposit-payout-candidate.interface';
import type { DepositPayoutDeficitInterface } from '../interface/deposit-payout-deficit.interface';
import type { DepositPayoutMatchInterface } from '../interface/deposit-payout-match.interface';
import type { DepositPayoutTargetInterface } from '../interface/deposit-payout-target.interface';
import type {
    AccountEntityInterface,
    ConsolidationScanScopeInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class DepositPayoutService extends Context.Service<DepositPayoutService>()('@budgie/ledger/DepositPayoutService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const settingsRepository = yield* SettingsRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionYieldRepository = yield* TransactionYieldRepository;
        const accountService = yield* AccountService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const depositInterestService = yield* DepositInterestService;
        const transactionTransferService = yield* TransactionTransferService;
        const transferCreationService = yield* TransferCreationService;
        const exchangeRatesService = yield* ExchangeRatesService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const amountTolerance = 0.03;
        const plausibleInterestRatio = 0.25;
        const payoutPhrases: Record<LanguageEnum, readonly string[]> = {
            [LanguageEnum.EN]: ['deposit payout', 'deposit maturity', 'deposit repayment', 'deposit closing'],
            [LanguageEnum.FR]: ['remboursement de dépôt', 'échéance de dépôt', 'versement de dépôt', 'clôture de dépôt'],
            [LanguageEnum.UK]: ['виплата депозиту', 'повернення депозиту', 'виплата вкладу', 'повернення вкладу', 'закриття депозиту'],
            [LanguageEnum.DE]: ['festgeld auszahlung', 'auszahlung festgeld', 'festgeld fälligkeit', 'festgeld auflösung'],
            [LanguageEnum.ES]: ['pago de depósito', 'vencimiento de depósito', 'reembolso de depósito', 'cierre de depósito']
        };

        const normalize = (value: string) =>
            value
                .toLowerCase()
                .normalize('NFD')
                .replaceAll(/\p{M}/gu, '')
                .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
                .trim();

        const normalizedPhrases = Object.values(payoutPhrases).flat().map(normalize);

        const isPayoutTitle = (title: string) => normalizedPhrases.some(phrase => ` ${normalize(title)} `.includes(` ${phrase} `));

        const isManual = (account: Pick<AccountEntityInterface, 'externalId' | 'externalSource'>) =>
            !isDefined(account.externalId) && !isDefined(account.externalSource);

        const isBankSourced = (transaction: Pick<TransactionWithEntriesEntityInterface, 'externalSource'>) =>
            BANK_EXTERNAL_SOURCES.some(source => source === transaction.externalSource);

        const findPayoutEntry = (transaction: TransactionWithEntriesEntityInterface) => {
            const entries = getTransactionCategoryEntries(transaction.entries);
            const [entry] = entries;
            const isUncategorized =
                isDefined(entry) &&
                (!isDefined(entry.categoryId) ||
                    entry.categorySource === CategorySourceEnum.MCC_DEFAULT ||
                    entry.categorySource === CategorySourceEnum.AI);

            return entries.length === 1 &&
                isUncategorized &&
                entry.type === TransactionEntryTypeEnum.DEBIT &&
                isPositiveNumber(entry.amount) &&
                !isDefined(transaction.yieldKind) &&
                !isDefined(transaction.consolidationType)
                ? entry
                : null;
        };

        const signedAmount = (entry: Pick<TransactionEntryEntityInterface, 'amount' | 'type'>) =>
            entry.type === TransactionEntryTypeEnum.DEBIT ? entry.amount : -entry.amount;

        const readBalance = (accountId: number) =>
            Effect.map(accountBalanceRepository.getLedgerBalances([accountId]), balances => balances.get(accountId) ?? 0);

        const findOpenDeposits = Effect.fnUntraced(function* () {
            const accounts = (yield* accountRepository.findBySearchQuery('', {
                includeTypes: [AccountTypeEnum.DEPOSIT],
                onlyActive: true
            })).filter(isManual);

            if (isEmptyArray(accounts)) {
                return [];
            }

            const balances = yield* accountBalanceRepository.getLedgerBalances(accounts.map(({ id }) => id));
            const deposits = yield* Effect.forEach(
                accounts,
                Effect.fnUntraced(function* (account) {
                    const balance = balances.get(account.id) ?? 0;
                    const { firstPrincipalAt } = yield* transactionYieldRepository.findDepositYieldTimeline(account.id);

                    return isPositiveNumber(balance) && isDefined(firstPrincipalAt)
                        ? [{ account, balance, firstPrincipalAt } satisfies DepositPayoutTargetInterface]
                        : [];
                })
            );

            return deposits.flat();
        });

        const findPayouts = Effect.fnUntraced(function* (since: Date, transactionIds: readonly number[] | null) {
            const transactions = (yield* transactionRepository.findIncomesBySourcesSince(
                BANK_EXTERNAL_SOURCES,
                since,
                transactionIds
            )).flatMap(transaction => {
                const entry = findPayoutEntry(transaction);

                return isDefined(entry) ? [{ transaction, entry }] : [];
            });

            if (isEmptyArray(transactions)) {
                return [];
            }

            const accounts = yield* accountRepository.findByIds([...new Set(transactions.map(({ entry }) => entry.accountId))]);
            const accountsById = new Map(accounts.map(account => [account.id, account]));

            return transactions.flatMap(({ transaction, entry }) => {
                const account = accountsById.get(entry.accountId);

                return isDefined(account) && account.type !== AccountTypeEnum.DEBT && account.type !== AccountTypeEnum.DEPOSIT
                    ? [{ transaction, entry, account } satisfies DepositPayoutCandidateInterface]
                    : [];
            });
        });

        const convertToDepositAmount = Effect.fnUntraced(function* (
            payout: DepositPayoutCandidateInterface,
            deposit: DepositPayoutTargetInterface
        ) {
            if (payout.account.instrumentId === deposit.account.instrumentId) {
                return payout.entry.amount;
            }

            const rate = yield* entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                payout.account.instrumentId,
                deposit.account.instrumentId,
                payout.transaction.operatedAt
            );

            return isPositiveNumber(rate) ? Math.round(payout.entry.amount * rate) : null;
        });

        const pickClosest = (matches: readonly DepositPayoutMatchInterface[]) => {
            if (isEmptyArray(matches)) {
                return null;
            }

            const bestRank = Math.min(...matches.map(({ rank }) => rank));
            const [best, runnerUp] = Arr.sort(
                matches.filter(({ rank }) => rank === bestRank),
                Order.mapInput(Order.Number, ({ distance }: DepositPayoutMatchInterface) => distance)
            );

            return !isDefined(runnerUp) || runnerUp.distance > best.distance ? best : null;
        };

        const matchDeposit = Effect.fnUntraced(function* (
            payout: DepositPayoutCandidateInterface,
            deposit: DepositPayoutTargetInterface,
            isTitled: boolean
        ) {
            const { operatedAt } = payout.transaction;

            if (deposit.account.id === payout.account.id || deposit.firstPrincipalAt >= operatedAt) {
                return null;
            }

            const amount = yield* convertToDepositAmount(payout, deposit);

            if (!isDefined(amount)) {
                return null;
            }

            const interest = yield* depositInterestService.estimateInterest(deposit.account.id, operatedAt);
            const expected = deposit.balance + interest;
            const unknownInterest = isTitled && !isPositiveNumber(interest) ? deposit.balance * plausibleInterestRatio : 0;
            const lowerBound = isTitled ? 0 : expected * (1 - amountTolerance);
            const upperBound = (expected + unknownInterest) * (1 + amountTolerance);
            const isSameIntegration =
                isDefined(deposit.account.integrationId) && deposit.account.integrationId === payout.account.integrationId;
            const isSameCurrency = deposit.account.instrumentId === payout.account.instrumentId;

            return amount > lowerBound && amount <= upperBound
                ? ({
                      deposit,
                      payout,
                      amount,
                      rank: (isSameIntegration ? 0 : 2) + (isSameCurrency ? 0 : 1),
                      distance: Math.abs(amount - expected) / expected
                  } satisfies DepositPayoutMatchInterface)
                : null;
        });

        const correctCrossCurrencyOpening = Effect.fnUntraced(function* (
            deposit: DepositPayoutTargetInterface,
            amount: number,
            operatedAt: Date
        ) {
            const transactions = yield* transactionRepository.findByAccountIdsWithEntries([deposit.account.id]);

            if (transactions.length !== 1) {
                return;
            }

            const [opening] = transactions;
            const receiving = opening.entries.find(
                entry => entry.accountId === deposit.account.id && entry.type === TransactionEntryTypeEnum.DEBIT
            );
            const source = opening.entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);

            if (
                opening.type !== TransactionTypeEnum.TRANSFER ||
                !isDefined(receiving) ||
                !isDefined(source) ||
                receiving.amount !== deposit.balance
            ) {
                return;
            }

            const sourceAccount = yield* accountRepository.findByIdIncludingArchived(source.accountId);
            const interest = yield* depositInterestService.estimateInterest(deposit.account.id, operatedAt);
            const principal = isPositiveNumber(interest) ? amount - interest : Math.floor(amount / PRECISION) * PRECISION;
            const isPlausible =
                isPositiveNumber(principal) &&
                principal !== receiving.amount &&
                Math.abs(principal - receiving.amount) <= receiving.amount * amountTolerance;

            if (!isDefined(sourceAccount) || sourceAccount.instrumentId === deposit.account.instrumentId || !isPlausible) {
                return;
            }

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: deposit.account.id,
                amount: principal,
                operatedAt: opening.operatedAt
            });

            yield* transactionEntryRepository.updateById(receiving.id, {
                amount: principal,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount
            });
            yield* transactionRepository.updateById(opening.id, { exchangeRate: source.amount / principal });
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([deposit.account.id]);
        });

        const closeAccount = Effect.fnUntraced(function* (depositAccountId: number) {
            yield* accountRepository.updateById(depositAccountId, { isActive: false });

            const settings = yield* settingsRepository.getSettings();

            if (settings.defaultAccountId === depositAccountId) {
                yield* settingsRepository.update({ defaultAccountId: null });
            }
        });

        const settle = Effect.fnUntraced(
            function* ({ deposit, payout, amount }: DepositPayoutMatchInterface, isFullClose: boolean) {
                const depositAccountId = deposit.account.id;
                const { operatedAt } = payout.transaction;
                const isSameCurrency = payout.account.instrumentId === deposit.account.instrumentId;

                if (!isFullClose) {
                    yield* transactionTransferService.convertIncomeFromAccount(payout.transaction.id, depositAccountId, amount);

                    return;
                }

                if (isSameCurrency) {
                    yield* correctCrossCurrencyOpening(deposit, amount, operatedAt);
                }

                const balance = yield* readBalance(depositAccountId);
                const delta = isSameCurrency
                    ? amount - balance
                    : yield* depositInterestService.estimateInterest(depositAccountId, operatedAt);

                yield* depositInterestService.recordPayoutDelta(depositAccountId, delta, operatedAt);
                yield* transactionTransferService.convertIncomeFromAccount(payout.transaction.id, depositAccountId, balance + delta);
                yield* closeAccount(depositAccountId);
            },
            effect => Db.transaction(effect)
        );

        const linkPayouts = Effect.fnUntraced(function* (scope: ConsolidationScanScopeInterface | null) {
            let deposits = isDefined(scope) && isEmptyArray(scope.transactionIds) ? [] : yield* findOpenDeposits();

            if (isEmptyArray(deposits)) {
                return 0;
            }

            const payouts = yield* findPayouts(
                min(deposits.map(({ firstPrincipalAt }) => firstPrincipalAt)),
                scope?.transactionIds ?? null
            );
            let linked = 0;

            for (const payout of payouts) {
                const isTitled = isPayoutTitle(payout.transaction.title);
                const match = pickClosest(
                    (yield* Effect.forEach(deposits, deposit => matchDeposit(payout, deposit, isTitled))).filter(isDefined)
                );
                const isSettled =
                    isDefined(match) &&
                    (yield* settle(match, match.amount >= match.deposit.balance * (1 - amountTolerance)).pipe(
                        Effect.as(true),
                        Effect.catchTag('DepositNegativeBalanceError', () => Effect.succeed(false))
                    ));

                if (isSettled) {
                    linked += 1;
                    deposits = yield* findOpenDeposits();
                }
            }

            return linked;
        });

        const findOverdrawnPayoutInterest = (
            account: AccountEntityInterface,
            transactions: readonly TransactionWithEntriesEntityInterface[]
        ) => {
            const deficits: DepositPayoutDeficitInterface[] = [];
            let running = 0;
            let inflow = 0;

            for (const transaction of transactions) {
                const delta = transaction.entries
                    .filter(entry => entry.accountId === account.id)
                    .reduce((sum, entry) => sum + signedAmount(entry), 0);

                running += delta;
                inflow += Math.max(0, delta);

                if (running < 0 && transaction.type === TransactionTypeEnum.TRANSFER && transaction.fromAccountId === account.id) {
                    deficits.push({ amount: -running, operatedAt: transaction.operatedAt });
                    running = 0;
                }
            }

            const total = deficits.reduce((sum, deficit) => sum + deficit.amount, 0);

            return running === 0 && isPositiveNumber(total) && total <= inflow * plausibleInterestRatio ? deficits : [];
        };

        const isPayoutOnlyAccount = (account: AccountEntityInterface, transactions: readonly TransactionWithEntriesEntityInterface[]) =>
            account.type === AccountTypeEnum.DEPOSIT ||
            transactions.every(
                transaction =>
                    (transaction.type === TransactionTypeEnum.TRANSFER &&
                        (transaction.toAccountId === account.id || isBankSourced(transaction))) ||
                    (transaction.type === TransactionTypeEnum.INCOME && transaction.yieldKind === YieldKindEnum.INTEREST)
            );

        const splitOverdrawnPayouts = Effect.fnUntraced(function* () {
            const accounts = (yield* accountRepository.findBySearchQuery('', {
                includeTypes: [AccountTypeEnum.DEPOSIT, AccountTypeEnum.BANK]
            })).filter(isManual);

            if (isEmptyArray(accounts)) {
                return 0;
            }

            const balances = yield* accountBalanceRepository.getLedgerBalances(accounts.map(({ id }) => id));
            let repaired = 0;

            for (const account of accounts.filter(({ id }) => (balances.get(id) ?? 0) < 0)) {
                const transactions = yield* transactionRepository.findByAccountIdsWithEntries([account.id]);
                const deficits = isPayoutOnlyAccount(account, transactions) ? findOverdrawnPayoutInterest(account, transactions) : [];

                if (isNotEmptyArray(deficits)) {
                    yield* Db.transaction(
                        Effect.forEach(
                            deficits,
                            deficit => depositInterestService.recordPayoutDelta(account.id, deficit.amount, deficit.operatedAt),
                            { discard: true }
                        )
                    );
                    repaired += 1;
                }
            }

            return repaired;
        });

        const findAdoptablePayout = Effect.fnUntraced(function* (
            depositAccountId: number,
            destinationAccountId: number,
            amountReceived: number
        ) {
            const deposit = (yield* findOpenDeposits()).find(({ account }) => account.id === depositAccountId);

            if (!isDefined(deposit) || !isPositiveNumber(amountReceived)) {
                return null;
            }

            const payouts = (yield* findPayouts(deposit.firstPrincipalAt, null)).filter(
                ({ account, transaction }) => account.id === destinationAccountId && transaction.operatedAt > deposit.firstPrincipalAt
            );
            const matches = yield* Effect.forEach(
                payouts,
                Effect.fnUntraced(function* (payout) {
                    const amount = yield* convertToDepositAmount(payout, deposit);
                    const distance = isDefined(amount) ? Math.abs(amount - amountReceived) / amountReceived : null;

                    return isDefined(amount) && isDefined(distance) && distance <= amountTolerance
                        ? ({ deposit, payout, amount, rank: 0, distance } satisfies DepositPayoutMatchInterface)
                        : null;
                })
            );

            return pickClosest(matches.filter(isDefined));
        });

        const resolveDepositCloseExchangeRate = Effect.fnUntraced(function* (
            fromInstrumentId: number,
            toInstrumentId: number,
            amountInMicroUnits: number
        ) {
            if (fromInstrumentId === toInstrumentId) {
                return 1;
            }

            const conversion = yield* exchangeRatesService.convertStrict(fromInstrumentId, toInstrumentId, amountInMicroUnits);

            if (!isDefined(conversion) || !isPositiveNumber(conversion.amount)) {
                return yield* Effect.die(new Error('No exchange rate available to close this deposit into the selected account'));
            }

            return amountInMicroUnits / conversion.amount;
        });

        const buildDepositCloseTransferInput = Effect.fnUntraced(function* (
            depositAccountId: number,
            destinationAccountId: number,
            amountInMicroUnits: number
        ) {
            const [depositAccount, destinationAccount] = yield* Effect.all(
                [accountService.findByIdOrFail(depositAccountId), accountService.findByIdOrFail(destinationAccountId)],
                { concurrency: 'unbounded' }
            );
            const exchangeRate = yield* resolveDepositCloseExchangeRate(
                depositAccount.instrumentId,
                destinationAccount.instrumentId,
                amountInMicroUnits
            );
            const amount = convertFromMicroUnits(amountInMicroUnits);

            return createTransactionInput({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: depositAccountId,
                toAccountId: destinationAccountId,
                amount,
                exchangeRate,
                entries: buildTransferEntries({
                    fromAccountId: depositAccountId,
                    toAccountId: destinationAccountId,
                    amount
                })
            });
        });

        return {
            reconcile: Effect.fn('DepositPayoutService.reconcile')(function* (scope: ConsolidationScanScopeInterface | null) {
                const linked = yield* linkPayouts(scope);
                const repaired = yield* splitOverdrawnPayouts();

                return linked + repaired;
            }),
            closeDepositTo: Effect.fn('DepositPayoutService.closeDepositTo')(
                function* (depositAccountId: number, destinationAccountId: number, amountReceived: number) {
                    const adoptable = Number.isFinite(amountReceived)
                        ? yield* findAdoptablePayout(depositAccountId, destinationAccountId, convertToMicroUnits(amountReceived))
                        : null;

                    if (isDefined(adoptable)) {
                        yield* settle(adoptable, true);

                        return;
                    }

                    yield* depositInterestService.recordCloseDelta(depositAccountId, amountReceived);

                    const depositBalanceMicroUnits = yield* readBalance(depositAccountId);

                    if (depositBalanceMicroUnits < 0) {
                        return yield* DepositNegativeBalanceError.make();
                    }

                    if (isPositiveNumber(depositBalanceMicroUnits)) {
                        const transferInput = yield* buildDepositCloseTransferInput(
                            depositAccountId,
                            destinationAccountId,
                            depositBalanceMicroUnits
                        );

                        yield* transferCreationService.createInternalTransfer(transferInput);
                    }

                    yield* closeAccount(depositAccountId);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(DepositPayoutService, DepositPayoutService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            AccountBalanceRepository.layer,
            SettingsRepository.layer,
            TransactionRepository.layer,
            TransactionEntryRepository.layer,
            TransactionYieldRepository.layer,
            AccountService.layer,
            AccountBalanceIncrementalService.layer,
            DepositInterestService.layer,
            TransactionTransferService.layer,
            TransferCreationService.layer,
            ExchangeRatesService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
