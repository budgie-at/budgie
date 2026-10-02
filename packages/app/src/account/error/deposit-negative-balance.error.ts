import { i18n } from '@lingui/core';
import * as Schema from 'effect/Schema';

export class DepositNegativeBalanceError extends Schema.TaggedError<DepositNegativeBalanceError>()('DepositNegativeBalanceError', {}) {
    override get message(): string {
        return i18n._({ id: 'account.depositNegativeBalanceDisallowed', message: 'Deposit balance cannot become negative' });
    }
}
