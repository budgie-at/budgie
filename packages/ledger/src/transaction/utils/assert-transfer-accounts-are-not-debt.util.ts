import { AccountTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { DebtTransferNotAllowedError } from '../error/debt-transfer-not-allowed.error';

import type { AccountEntityInterface } from '@budgie/contracts';

export const assertTransferAccountsAreNotDebt = (
    accounts: readonly Pick<AccountEntityInterface, 'type'>[]
): Effect.Effect<void, DebtTransferNotAllowedError> =>
    accounts.some(account => account.type === AccountTypeEnum.DEBT) ? Effect.fail(new DebtTransferNotAllowedError()) : Effect.void;
