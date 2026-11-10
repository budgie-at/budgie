import type { AppServices } from '../../@generic/runtime/app.runtime';
import type {
    TransactionCreateInputInterface,
    TransactionCreateInputSchema,
    TransactionEntityInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import type { ReceiptMatchInputInterface } from '@budgie/ledger';
import type * as Cause from 'effect/Cause';
import type * as Effect from 'effect/Effect';

export interface CreateTransactionFormConfigInterface {
    readonly onSubmit: (
        data: TransactionCreateInputInterface
    ) => Effect.Effect<TransactionEntityInterface, Cause.YieldableError, AppServices>;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly type: TransactionTypeEnum;
    readonly schema: typeof TransactionCreateInputSchema;
    readonly receipt?: ReceiptMatchInputInterface | null;
    readonly categoryId?: number;
    readonly comment?: string;
    readonly title?: string;
    readonly operatedAt?: Date;
    readonly amount?: number;
}
