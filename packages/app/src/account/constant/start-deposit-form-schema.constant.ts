import { DepositAccountCreateInputSchema } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

export const StartDepositFormSchema = Schema.Struct({
    ...DepositAccountCreateInputSchema.fields,
    currentBalance: Schema.Finite.check(Schema.isGreaterThan(0))
});
