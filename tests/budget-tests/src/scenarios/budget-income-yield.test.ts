import { AccountTypeEnum, PRECISION, TransactionEntityTable, YieldKindEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { readBudgetIncomeReceived, seedParityAccounts, seedParityIncome, testDb, TestLayer, testSeedService } from '../harness';

const tag = (transactionId: number, yieldKind: YieldKindEnum) =>
    testDb.update(TransactionEntityTable).set({ yieldKind }).where(eq(TransactionEntityTable.id, transactionId));

layer(TestLayer)('budget income received with yield', it => {
    it.effect('ignores crypto yield and interest that lands in a deposit, and counts other interest and dividends', () =>
        Effect.gen(function* () {
            const { bankAccount } = yield* seedParityAccounts();
            const deposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT, instrumentId: bankAccount.instrumentId });

            yield* seedParityIncome('salary', bankAccount.id, 2000);

            const staking = yield* seedParityIncome('staking', bankAccount.id, 10);
            const earn = yield* seedParityIncome('earn', bankAccount.id, 20);
            const distribution = yield* seedParityIncome('distribution', bankAccount.id, 30);
            const bankInterest = yield* seedParityIncome('bank-interest', bankAccount.id, 40);
            const dividend = yield* seedParityIncome('dividend', bankAccount.id, 50);
            const optedOut = yield* seedParityIncome('opted-out', bankAccount.id, 60);
            const depositInterest = yield* seedParityIncome('deposit-interest', deposit.id, 70);

            yield* tag(staking.id, YieldKindEnum.STAKING);
            yield* tag(earn.id, YieldKindEnum.EARN);
            yield* tag(distribution.id, YieldKindEnum.DISTRIBUTION);
            yield* tag(bankInterest.id, YieldKindEnum.INTEREST);
            yield* tag(dividend.id, YieldKindEnum.DIVIDEND);
            yield* tag(optedOut.id, YieldKindEnum.NONE);
            yield* tag(depositInterest.id, YieldKindEnum.INTEREST);

            expect(yield* readBudgetIncomeReceived()).toBe((2000 + 40 + 50 + 60) * PRECISION);
        })
    );
});
