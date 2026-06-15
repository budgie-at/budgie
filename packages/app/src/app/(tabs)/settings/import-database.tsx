import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { isE2eApp } from '../../../@generic/utils/is-e2e-app.util';
import { authService } from '../../../auth/service/auth.service';
import { databaseImportService } from '../../../import/service/database-import.service';

import { ImportScreenSelector } from './import-screen.selector';

export default function ImportDatabaseScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        if (!isE2eApp() || !isNotEmptyString(fileUri)) {
            router.replace('/settings');

            return () => {
                isMounted = false;
            };
        }

        void databaseImportService
            .replaceFromUri(fileUri)
            .then(() => authService.clearAllPins())
            .then(
                () => {
                    if (!isMounted) {
                        return false;
                    }

                    setIsReady(true);

                    return true;
                },
                () => {
                    if (!isMounted) {
                        return false;
                    }

                    router.replace('/settings');

                    return true;
                }
            );

        return () => {
            isMounted = false;
        };
    }, [fileUri]);

    if (isReady) {
        return (
            <View testID={ImportScreenSelector.DatabaseImportReady} className="flex-1 items-center justify-center">
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
        </View>
    );
}
