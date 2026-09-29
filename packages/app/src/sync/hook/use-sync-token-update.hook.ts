import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { EmptyFn, getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { AbstractPollingSyncService } from '../service/abstract-polling-sync.service';
import { syncProviderRegistryService } from '../service/sync-provider-registry.service';

export const useSyncTokenUpdate = () => {
    const { t } = useLingui();

    const [isSaving, setIsSaving] = useState(false);

    const saveAccountSyncToken = async (accountId: number, token: string, onSuccess: EmptyFn) => {
        setIsSaving(true);
        try {
            const service = await appRuntime.runPromise(syncProviderRegistryService.getServiceForAccount(accountId));

            if (service instanceof AbstractPollingSyncService) {
                await appRuntime.runPromise(service.updateAccountToken(accountId, token));
            }
            onSuccess();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Could not update token`, text2: getErrorMessage(error) });
        } finally {
            setIsSaving(false);
        }
    };

    return { isSaving, saveAccountSyncToken };
};
