import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testSeedService } from './test-context';

export const seedPrivatbankTransaction = Effect.fnUntraced(function* (input: {
    readonly accountId: number;
    readonly exchangeRate: number;
    readonly externalId: string;
    readonly isRefund: boolean;
    readonly operatedAt: Date;
    readonly originalAmount: number;
    readonly title: string;
}) {
    const entry = {
        accountId: input.accountId,
        amount: convertToMicroUnits(input.originalAmount * input.exchangeRate),
        exchangeRate: input.exchangeRate
    };
    const transaction = input.isRefund
        ? yield* testSeedService.bankPairIncome({ externalId: input.externalId, operatedAt: input.operatedAt }, entry)
        : yield* testSeedService.bankPairExpense({ externalId: input.externalId, operatedAt: input.operatedAt }, entry);

    return yield* testSeedService.updateTransaction(transaction.id, { title: input.title, externalSource: ExternalSourceEnum.PRIVATBANK });
});
