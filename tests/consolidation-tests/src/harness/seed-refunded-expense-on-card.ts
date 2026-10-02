import { testSeedService } from './test-context';

export const seedRefundedExpenseOnCard = (
    cardExternalId: string,
    input: Omit<Parameters<typeof testSeedService.refundedExpense>[0], 'accountId'>
) => {
    const account = testSeedService.account({ externalId: cardExternalId });

    return { account, ...testSeedService.refundedExpense({ ...input, accountId: account.id }) };
};
