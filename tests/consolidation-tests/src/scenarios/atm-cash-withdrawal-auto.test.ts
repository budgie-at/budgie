import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountTypeEnum, CategorySourceEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    expectConsolidationParent,
    fetchLedgerBalances,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const CASH_ACCOUNT_CREATED_AT = new Date(Date.now() - 30 * DAY_MILLISECONDS);
const ATM_OPERATED_AT = new Date(Date.now() - DAY_MILLISECONDS);
const BEFORE_CASH_ACCOUNT_OPERATED_AT = new Date(Date.now() - 400 * DAY_MILLISECONDS);
const ATM_WITHDRAWAL_AMOUNT = 10 * PRECISION;

const seedCashAccount = (instrumentId: number) =>
    testSeedService.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId, createdAt: CASH_ACCOUNT_CREATED_AT });

const seedWithdrawal = (input: {
    readonly accountId: number;
    readonly externalId: string;
    readonly title: string;
    readonly externalSource: ExternalSourceEnum;
    readonly mcc: string | null;
    readonly operatedAt: Date;
}) =>
    Effect.gen(function* () {
        const mccCategoryId = isDefined(input.mcc) ? (yield* testQueryService.findMccByCode(input.mcc)).id : null;
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: input.externalId, operatedAt: input.operatedAt },
            { accountId: input.accountId, amount: ATM_WITHDRAWAL_AMOUNT, mccCategoryId }
        );

        return yield* testSeedService.updateTransaction(expense.id, { title: input.title, externalSource: input.externalSource });
    });

const fetchConsolidationParentIds = (transactionIds: readonly number[]) =>
    Effect.forEach(transactionIds, transactionId =>
        testQueryService.fetchTransactionById(transactionId).pipe(Effect.map(transaction => transaction.consolidationParentTransactionId))
    );

layer(TestLayer)('consolidation/atm-cash-withdrawal-auto', it => {
    it.effect('recognises MCC-less withdrawals of any bank by their localized title prefix', () =>
        Effect.gen(function* () {
            const bankAccount = yield* testSeedService.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK_SYNC });
            const cashAccount = yield* seedCashAccount(bankAccount.instrumentId);
            const seedTitledWithdrawal = (externalId: string, title: string, externalSource: ExternalSourceEnum) =>
                seedWithdrawal({ accountId: bankAccount.id, externalId, title, externalSource, mcc: null, operatedAt: ATM_OPERATED_AT });
            const withdrawals = [
                yield* seedTitledWithdrawal('erste-bankomat', 'BANKOMAT QUELLENSTRAS WIENFAVORITEN 1100 040', ExternalSourceEnum.ERSTE),
                yield* seedTitledWithdrawal('mono-legacy', 'Банкомат Erste Bank', ExternalSourceEnum.MONOBANK),
                yield* seedTitledWithdrawal('privat-atm', 'ATM PrivatBank Kyiv', ExternalSourceEnum.PRIVATBANK)
            ];
            const purchases = [
                yield* seedTitledWithdrawal('erste-shop', 'BANKOMATENSHOP WIEN 1010', ExternalSourceEnum.ERSTE),
                yield* seedTitledWithdrawal('erste-bar', 'ATMOSPHERE BAR WIEN 1010 040', ExternalSourceEnum.ERSTE),
                yield* seedTitledWithdrawal('erste-cash-back', 'POS 0,10 Cash 30,00', ExternalSourceEnum.ERSTE)
            ];

            expect(yield* runConsolidation()).toEqual({ consolidated: withdrawals.length, found: withdrawals.length });
            expect((yield* fetchConsolidationParentIds(withdrawals.map(transaction => transaction.id))).every(isDefined)).toBe(true);
            expect(yield* fetchConsolidationParentIds(purchases.map(transaction => transaction.id))).toEqual([null, null, null]);
            expect(yield* fetchLedgerBalances([cashAccount.id])).toEqual([[cashAccount.id, withdrawals.length * ATM_WITHDRAWAL_AMOUNT]]);
        })
    );

    it.effect('leaves a withdrawal alone without a single cash account in its currency or made before the cash account existed', () =>
        Effect.gen(function* () {
            const euro = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const dollar = yield* testSeedService.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
            const hryvniaBank = yield* testSeedService.account({ title: 'Mono UAH', type: AccountTypeEnum.BANK_SYNC });
            const euroBank = yield* testSeedService.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK_SYNC, instrumentId: euro.id });
            const dollarBank = yield* testSeedService.account({
                title: 'Mono USD',
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: dollar.id
            });
            const hryvniaCash = yield* seedCashAccount(hryvniaBank.instrumentId);
            const dollarCashAccounts = [yield* seedCashAccount(dollar.id), yield* seedCashAccount(dollar.id)];
            const accountIds = [
                hryvniaBank.id,
                euroBank.id,
                dollarBank.id,
                hryvniaCash.id,
                ...dollarCashAccounts.map(account => account.id)
            ];
            const withdrawals = [
                yield* seedWithdrawal({
                    accountId: hryvniaBank.id,
                    externalId: 'before-cash-account',
                    title: 'Банкомат Privat',
                    externalSource: ExternalSourceEnum.MONOBANK,
                    mcc: '6011',
                    operatedAt: BEFORE_CASH_ACCOUNT_OPERATED_AT
                }),
                yield* seedWithdrawal({
                    accountId: euroBank.id,
                    externalId: 'no-euro-cash',
                    title: 'BANKOMAT QUELLENSTRAS WIENFAVORITEN 1100 040',
                    externalSource: ExternalSourceEnum.ERSTE,
                    mcc: null,
                    operatedAt: ATM_OPERATED_AT
                }),
                yield* seedWithdrawal({
                    accountId: dollarBank.id,
                    externalId: 'two-dollar-cash',
                    title: 'ATM Chase',
                    externalSource: ExternalSourceEnum.MONOBANK,
                    mcc: '6011',
                    operatedAt: ATM_OPERATED_AT
                })
            ];
            const balancesBefore = yield* fetchLedgerBalances(accountIds);

            expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });
            expect(yield* fetchConsolidationParentIds(withdrawals.map(transaction => transaction.id))).toEqual([null, null, null]);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBefore);
        })
    );

    it.effect('respects a withdrawal the user categorized, still offering it for a manual move, and moves one categorized by AI', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const bankAccount = yield* testSeedService.account({ title: 'Mono', type: AccountTypeEnum.BANK_SYNC });
            const cashAccount = yield* seedCashAccount(bankAccount.instrumentId);
            const category = yield* testSeedService.category('Cash spending');
            const seedCategorizedWithdrawal = (externalId: string, categorySource: CategorySourceEnum) =>
                Effect.gen(function* () {
                    const expense = yield* seedWithdrawal({
                        accountId: bankAccount.id,
                        externalId,
                        title: 'Банкомат Erste Bank',
                        externalSource: ExternalSourceEnum.MONOBANK,
                        mcc: '6011',
                        operatedAt: ATM_OPERATED_AT
                    });
                    const [entry] = yield* fetchOwnLedgerEntries(expense.id);

                    yield* testSeedService.entryCategory(entry.id, category.id, categorySource);

                    return expense;
                });
            const userCategorized = yield* seedCategorizedWithdrawal('user-category', CategorySourceEnum.USER);
            const aiCategorized = yield* seedCategorizedWithdrawal('ai-category', CategorySourceEnum.AI);

            expect(yield* runConsolidation()).toEqual({ consolidated: 1, found: 1 });
            expect(yield* fetchConsolidationParentIds([userCategorized.id])).toEqual([null]);
            expect(yield* consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds([userCategorized.id])).toEqual([
                userCategorized.id
            ]);
            yield* expectConsolidationParent(
                aiCategorized.id,
                yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)
            );
            expect(yield* fetchLedgerBalances([cashAccount.id])).toEqual([[cashAccount.id, ATM_WITHDRAWAL_AMOUNT]]);
        })
    );
});
