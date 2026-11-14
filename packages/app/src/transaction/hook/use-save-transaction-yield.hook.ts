import { logAndContinue } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { TransactionCreateEntityInterface } from '@budgie/contracts';

export const useSaveTransactionYield = (transactionId: number) => {
    const { t } = useLingui();

    return (patch: Partial<Pick<TransactionCreateEntityInterface, 'yieldKind' | 'yieldSourceAccountId'>>) =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(TransactionService, service => service.updateYield(transactionId, patch)).pipe(
                    toastOnFailure(t`Could not save the change.`)
                )
            )
        );
};
