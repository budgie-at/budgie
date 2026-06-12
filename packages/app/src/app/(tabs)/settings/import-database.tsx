import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { isE2eApp } from '../../../@generic/utils/is-e2e-app.util';
import { databaseImportService } from '../../../import/service/database-import.service';

export default function ImportDatabaseScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

    useEffect(() => {
        if (!isE2eApp() || !isNotEmptyString(fileUri)) {
            router.replace('/settings');

            return;
        }

        void databaseImportService
            .replaceFromUri(fileUri)
            .then(() => {
                dismissAllOrReplace('/');

                return null;
            })
            .catch(() => {
                router.replace('/settings');

                return null;
            });
    }, [fileUri]);

    return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
        </View>
    );
}
