import { TransactionService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';

export const runConfirmedTransactionAction = <E>(
    confirmOptions: Parameters<typeof confirmAlert>[0],
    errorText: string,
    action: (transactionService: typeof TransactionService.Service) => Effect.Effect<unknown, E, AppServices>
): Effect.Effect<boolean, E, AppServices> =>
    Effect.gen(function* () {
        if (!(yield* confirmAlert(confirmOptions))) {
            return false;
        }

        yield* Effect.flatMap(TransactionService, action).pipe(toastOnFailure(errorText));

        return true;
    });
