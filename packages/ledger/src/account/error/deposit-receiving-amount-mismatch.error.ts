import { t } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';

export class DepositReceivingAmountMismatchError extends Schema.TaggedError<DepositReceivingAmountMismatchError>()(
    'DepositReceivingAmountMismatchError',
    {}
) {
    override get message(): string {
        return t`A deposit in the funding account currency must receive the full funding amount`;
    }
}
