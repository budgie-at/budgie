import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useEffect, useEffectEvent, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { EnableBankingConnectionService } from '../service/enable-banking-connection.service';
import { parseEnableBankingApplicationId } from '../utils/parse-enable-banking-application-id.util';

import { useExplainEnableBankingError } from './use-explain-enable-banking-error.hook';

import type { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';

export const useEnableBankingKeyState = (run: ReturnType<typeof useSingleFlight>['run'], initialApplicationId: string | null) => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();
    const [applicationId, setApplicationId] = useState(initialApplicationId ?? '');
    const [pickedPem, setPickedPem] = useState<string | null>(null);
    const [isKeySaved, setIsKeySaved] = useState(isDefined(initialApplicationId));
    const [savedApplicationId, setSavedApplicationId] = useState<string | null>(null);

    const discardSavedKey = (applicationIdToDiscard: string | null) => {
        if (isDefined(applicationIdToDiscard)) {
            appRuntime.runFork(
                Effect.flatMap(EnableBankingConnectionService, connection => connection.discardUnusedKey(applicationIdToDiscard)).pipe(
                    Effect.ignore
                )
            );
        }
    };

    const handleUnmount = useEffectEvent(() => {
        discardSavedKey(savedApplicationId);
    });

    useEffect(() => () => void handleUnmount(), []);

    return {
        applicationId,
        parsedApplicationId: parseEnableBankingApplicationId(applicationId),
        isKeyPicked: isDefined(pickedPem) || isKeySaved,
        handleApplicationIdChange: (value: string) => {
            if (value !== savedApplicationId) {
                discardSavedKey(savedApplicationId);
                setSavedApplicationId(null);
            }
            setApplicationId(value);
            setIsKeySaved(false);
        },
        handlePickKey: () =>
            run(
                Effect.gen(function* () {
                    const picked = yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.pickKeyFile());

                    if (isDefined(picked)) {
                        setPickedPem(picked.pem);
                        setIsKeySaved(false);
                        if (isDefined(picked.applicationId)) {
                            setApplicationId(picked.applicationId);
                        }
                    }
                }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not read the key`))
            ),
        savePickedKey: Effect.fnUntraced(function* (parsedApplicationId: string) {
            if (isDefined(pickedPem)) {
                yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.saveKey(parsedApplicationId, pickedPem));
                setPickedPem(null);
                setIsKeySaved(true);
                setSavedApplicationId(parsedApplicationId);
            }
        })
    };
};
