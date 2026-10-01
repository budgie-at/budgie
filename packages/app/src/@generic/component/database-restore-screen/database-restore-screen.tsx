import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { DatabaseRestoreService } from '../../drizzle/service/database-restore.service';
import { databaseRestoreRuntime } from '../../runtime/database-restore.runtime';
import { reloadApp } from '../../utils/reload-app.util';
import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Page } from '../page/page';

import type { Edge } from 'react-native-safe-area-context';

export const DatabaseRestoreScreen = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const [isBackupRejected, setIsBackupRejected] = useState(false);
    const safeEdges: Edge[] = ['top', 'bottom'];

    useEffect(() => {
        void SplashScreen.hideAsync();
    }, []);

    const handleRestore = () => {
        setIsLoading(true);
        databaseRestoreRuntime.runFork(
            Effect.flatMap(DatabaseRestoreService, databaseRestoreService => databaseRestoreService.restoreFromPickedBackup()).pipe(
                Effect.match({ onFailure: () => true, onSuccess: identity }),
                Effect.tap(isRejected =>
                    Effect.sync(() => {
                        setIsBackupRejected(isRejected);
                        setIsLoading(false);
                    })
                )
            )
        );
    };

    const handleRetry = () => void reloadApp();

    return (
        <Page safeEdges={safeEdges} className="bg-primary-reverse" contentClassName="justify-center">
            <View className="gap-y-5xl">
                <View className="items-center gap-y-3xl">
                    <CircleIcon icon={UserIconNameEnum.DatabaseBackup} variant="destructive" border={false} size={64} iconSize={30} />
                    <View className="gap-y-md">
                        <Text className="text-center text-2xl font-semibold text-primary">
                            <Trans>Budgie could not open your data</Trans>
                        </Text>
                        <Text className="text-center text-sm leading-6 text-secondary-foreground">
                            <Trans>
                                Your data stays on this device untouched. Try again, or restore a backup made with your current PIN.
                            </Trans>
                        </Text>
                        {isBackupRejected ? (
                            <Text className="text-center text-sm leading-6 text-destructive-foreground">
                                <Trans>This backup could not be opened with your current PIN.</Trans>
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View className="gap-y-lg">
                    <Button
                        variant="cta"
                        leftIcon={UserIconNameEnum.ArchiveRestore}
                        content={t`Restore from Backup`}
                        isLoading={isLoading}
                        onPress={handleRestore}
                    />
                    <Button variant="ghost" leftIcon={UserIconNameEnum.RefreshCw} content={t`Try Again`} onPress={handleRetry} />
                </View>
            </View>
        </Page>
    );
};
