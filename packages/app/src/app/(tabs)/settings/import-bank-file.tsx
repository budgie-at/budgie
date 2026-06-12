import { ExternalSourceEnum } from '@budgie/contracts';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { isE2eApp } from '../../../@generic/utils/is-e2e-app.util';
import { ersteSyncService } from '../../../sync/service/erste-sync.service';
import { privatbankSyncService } from '../../../sync/service/privatbank-sync.service';

export default function ImportBankFileScreen() {
    const { fileUri, runId, source } = useLocalSearchParams<{
        fileUri?: string;
        runId?: string;
        source?: ExternalSourceEnum;
    }>();

    useEffect(() => {
        if (!isE2eApp() || !isDefined(fileUri) || !isDefined(source)) {
            router.replace('/settings');

            return;
        }

        if (source === ExternalSourceEnum.ERSTE) {
            void ersteSyncService
                .importAllAccounts(fileUri)
                .then(() => {
                    router.replace('/');

                    return null;
                })
                .catch(() => {
                    router.replace('/settings');

                    return null;
                });

            return;
        }

        if (source === ExternalSourceEnum.PRIVATBANK) {
            void privatbankSyncService
                .importAllAccounts(fileUri)
                .then(() => {
                    router.replace('/');

                    return null;
                })
                .catch(() => {
                    router.replace('/settings');

                    return null;
                });

            return;
        }

        router.replace('/settings');
    }, [fileUri, runId, source]);

    return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
        </View>
    );
}
