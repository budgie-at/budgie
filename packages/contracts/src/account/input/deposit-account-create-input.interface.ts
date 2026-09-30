import type { DepositAccountCreateInputSchema } from '../schema/deposit-account-create-input.schema';
import type { Mutable } from 'effect/Types';

export type DepositAccountCreateInputInterface = Mutable<typeof DepositAccountCreateInputSchema.Type>;
