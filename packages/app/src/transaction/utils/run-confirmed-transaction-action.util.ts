import { TransactionService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';

export const runConfirmedTransactionAction = async (
    confirmOptions: Parameters<typeof confirmAlert>[0],
    errorText: string,
    action: (transactionService: typeof TransactionService.Service) => Effect.Effect<unknown, unknown, AppServices>
): Promise<boolean> => {
    const confirmed = await confirmAlert(confirmOptions);

    if (!confirmed) {
        return false;
    }

    try {
        await appRuntime.runPromise(Effect.flatMap(TransactionService, action));

        return true;
    } catch (error: unknown) {
        Toast.show({ type: 'error', text1: errorText, text2: getErrorMessage(error) });

        return false;
    }
};
