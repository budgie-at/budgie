import { SyncProviderRegistryService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { EmptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';

export const useSyncTokenUpdate = () => {
    const { t } = useLingui();

    const [isSaving, setIsSaving] = useState(false);

    const saveAccountSyncToken = async (accountId: number, token: string, onSuccess: EmptyFn) => {
        setIsSaving(true);
        try {
            await appRuntime.runPromise(
                Effect.flatMap(SyncProviderRegistryService, syncProviderRegistryService =>
                    Effect.flatMap(syncProviderRegistryService.getServiceForAccount(accountId), service =>
                        isDefined(service) && 'updateAccountToken' in service ? service.updateAccountToken(accountId, token) : Effect.void
                    )
                )
            );
            onSuccess();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Could not update token`, text2: getErrorMessage(error) });
        } finally {
            setIsSaving(false);
        }
    };

    return { isSaving, saveAccountSyncToken };
};
