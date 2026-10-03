import { UserIconNameEnum } from '@budgie/contracts';
import { makeLoggerLayer } from '@budgie/logger';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { restoreDatabaseFromPickedBackup } from '../../drizzle/utils/restore-database-from-picked-backup.util';
import { isLoggingEnabled } from '../../utils/is-logging-enabled.util';
import { reloadApp } from '../../utils/reload-app.util';
import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Page } from '../page/page';

import type { Edge } from 'react-native-safe-area-context';

export const DatabaseRestoreScreen = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const [backupError, setBackupError] = useState<string | null>(null);
    const safeEdges: Edge[] = ['top', 'bottom'];

    useEffect(() => {
        void SplashScreen.hideAsync();
    }, []);

    const handleRestore = () => {
        setIsLoading(true);
        Effect.runFork(
            restoreDatabaseFromPickedBackup().pipe(
                Effect.as(null),
                Effect.catchTags({
                    UnsupportedBackupError: () => Effect.succeed(t`This backup was made by an older Budgie version and cannot be restored.`)
                }),
                Effect.catch(() => Effect.succeed(t`This backup could not be opened with your current PIN.`)),
                Effect.tap(nextBackupError =>
                    Effect.sync(() => {
                        setBackupError(nextBackupError);
                        setIsLoading(false);
                    })
                ),
                Effect.provide(Layer.mergeAll(makeLoggerLayer(isLoggingEnabled()), Reactivity.layer))
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
                        {isDefined(backupError) ? (
                            <Text className="text-center text-sm leading-6 text-destructive-foreground">{backupError}</Text>
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
