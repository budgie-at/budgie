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
        let isMounted = true;

        if (!isE2eApp() || !isNotEmptyString(fileUri)) {
            router.replace('/settings');

            return () => {
                isMounted = false;
            };
        }

        void databaseImportService.replaceFromUri(fileUri).then(
            () => {
                if (!isMounted) {
                    return false;
                }

                dismissAllOrReplace('/');

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

    return (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
        </View>
    );
}
