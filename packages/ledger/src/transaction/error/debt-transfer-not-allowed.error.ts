import { t } from '@lingui/core/macro';
import * as Schema from 'effect/Schema';

export class DebtTransferNotAllowedError extends Schema.TaggedError<DebtTransferNotAllowedError, { readonly brand: unique symbol }>()(
    'DebtTransferNotAllowedError',
    {}
) {
    override get message(): string {
        return t`Debt accounts cannot take part in transfers`;
    }
}
