import { EnableBankingSyncService, SyncUnauthorizedError } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupStepEnum } from '../enum/enable-banking-setup-step.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';
import { EnableBankingConnectionService } from '../service/enable-banking-connection.service';

import { useExplainEnableBankingError } from './use-explain-enable-banking-error.hook';

import type { useEnableBankingKeyState } from './use-enable-banking-key-state.hook';
import type { EnableBankingBankInterface } from '@budgie/sync';
import type { Dispatch, SetStateAction } from 'react';

export const useEnableBankingBankLoading = (
    setStep: Dispatch<SetStateAction<EnableBankingSetupStepEnum>>,
    savePickedKey: ReturnType<typeof useEnableBankingKeyState>['savePickedKey'],
    connectAccountId: number | null
) => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();

    const loadBanks = (applicationId: string) =>
        Effect.gen(function* () {
            yield* savePickedKey(applicationId);

            return yield* Effect.flatMap(EnableBankingSyncService, service => service.listBanks(applicationId)).pipe(
                Effect.mapError(error =>
                    Schema.is(SyncUnauthorizedError)(error)
                        ? EnableBankingSetupError.make({ reason: EnableBankingSetupErrorReasonEnum.INACTIVE_APPLICATION })
                        : error
                )
            );
        }).pipe(
            Effect.tapError(() =>
                Effect.sync(() => {
                    setStep(EnableBankingSetupStepEnum.KEY);
                })
            ),
            Effect.mapError(explainError),
            toastOnFailure(t`Could not verify the application`)
        );

    const beginAuthorization = (applicationId: string, bank: EnableBankingBankInterface) =>
        Effect.gen(function* () {
            setStep(EnableBankingSetupStepEnum.WAITING);
            yield* Effect.flatMap(EnableBankingConnectionService, connection =>
                connection.begin(applicationId, bank, null, connectAccountId)
            );
        }).pipe(
            Effect.tapError(() =>
                Effect.sync(() => {
                    setStep(EnableBankingSetupStepEnum.BANK);
                })
            ),
            Effect.mapError(explainError),
            toastOnFailure(t`Could not start the authorization`)
        );

    return { loadBanks, beginAuthorization };
};
