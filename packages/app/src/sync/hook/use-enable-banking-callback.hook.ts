import { EnableBankingCallbackError, EnableBankingCallbackFailureEnum } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useEffect, useEffectEvent } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { enableBankingCallbackUrlAtom } from '../constant/enable-banking-callback-url-atom.constant';
import { EnableBankingConnectionService } from '../service/enable-banking-connection.service';

import { useExplainEnableBankingError } from './use-explain-enable-banking-error.hook';

import type { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import type { EnableBankingAuthorizationInterface } from '../interface/enable-banking-authorization.interface';

export const useEnableBankingCallback = (
    run: ReturnType<typeof useSingleFlight>['run'],
    isBusy: boolean,
    onAuthorized: (result: EnableBankingAuthorizationInterface) => void,
    onFailed: () => void
) => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();
    const callbackUrl = useAtomValue(enableBankingCallbackUrlAtom);

    const handleCallback = useEffectEvent((url: string) =>
        run(
            Effect.flatMap(EnableBankingConnectionService, connection => connection.finish(url)).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        onAuthorized(result);
                    })
                ),
                Effect.tapError(error =>
                    Effect.sync(() => {
                        const isForeignCallback =
                            Schema.is(EnableBankingCallbackError)(error) &&
                            (error.failure === EnableBankingCallbackFailureEnum.STATE_MISMATCH ||
                                error.failure === EnableBankingCallbackFailureEnum.MALFORMED);

                        if (!isForeignCallback) {
                            onFailed();
                        }
                    })
                ),
                Effect.mapError(explainError),
                toastOnFailure(t`Could not connect the bank`)
            )
        )
    );

    useEffect(() => {
        if (isDefined(callbackUrl) && !isBusy) {
            appAtomRegistry.set(enableBankingCallbackUrlAtom, null);
            void handleCallback(callbackUrl);
        }
    }, [callbackUrl, isBusy]);
};
