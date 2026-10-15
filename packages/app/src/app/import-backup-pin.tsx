import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { File } from 'expo-file-system';
import React, { useEffect, useEffectEvent, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { GoBackButton } from '../@generic/component/go-back-button/go-back-button';
import { Icon } from '../@generic/component/icon/icon';
import { LoadingOverlay } from '../@generic/component/loading-overlay/loading-overlay';
import { FullPage } from '../@generic/component/page/full-page';
import { useFormatFileSize } from '../@generic/hook/use-format-file-size.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { PinForm } from '../auth/components/pin-form/pin-form';
import { PIN_LENGTH } from '../auth/constant/pin-length.constant';
import { useImportBackupPinModal, useImportBackupPinModalParams } from '../import/context/import-backup-pin-modal.context';
import { DatabaseImportService } from '../import/service/database-import.service';

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export default function ImportBackupPinModal() {
    const { t } = useLingui();
    const [, resolveImportBackupPin, dismissImportBackupPin] = useImportBackupPinModal();
    useModalDismiss(dismissImportBackupPin);
    const sourceUri = useImportBackupPinModalParams();
    const formatFileSize = useFormatFileSize();

    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const submitPin = async (pin: string) => {
        if (!isNotEmptyString(sourceUri)) {
            return;
        }

        setIsLoading(true);

        const backupError = await appRuntime.runPromise(
            Effect.flatMap(DatabaseImportService, databaseImportService => databaseImportService.canOpenBackup(sourceUri, pin)).pipe(
                Effect.map(canOpenBackup => (canOpenBackup ? null : t`Incorrect PIN`)),
                Effect.catchTags({
                    BackupArchiveMissingDatabaseError: () => Effect.succeed(t`This backup archive does not contain a Budgie database.`),
                    InsufficientStorageError: () => Effect.succeed(t`Not enough free storage to extract this backup.`),
                    UnsupportedBackupError: () => Effect.succeed(t`This backup was made by an older Budgie version and cannot be imported.`)
                })
            )
        );

        setIsLoading(false);

        if (!isDefined(backupError)) {
            resolveImportBackupPin(pin);

            return;
        }

        setInput('');
        setError(backupError);
    };

    const addDigit = (digit: string) => {
        const nextInput = (input + digit).slice(0, PIN_LENGTH);

        setInput(nextInput);
        setError(null);

        if (input.length === PIN_LENGTH - 1) {
            void submitPin(nextInput);
        }
    };

    const deleteDigit = () => {
        setInput(input.slice(0, -1));
        setError(null);
    };

    const handleCancel = () => void resolveImportBackupPin(null);

    const handleDismiss = useEffectEvent(() => {
        resolveImportBackupPin(null, { skipBack: true });
    });

    useEffect(() => () => void handleDismiss(), []);

    const backupFile = isNotEmptyString(sourceUri) ? new File(sourceUri) : null;
    const backupFileName = isDefined(backupFile) ? decodeURIComponent(backupFile.name) : '';
    const backupFileSize = isDefined(backupFile) && backupFile.exists ? formatFileSize(backupFile.size) : '';

    return (
        <FullPage>
            <View className="flex-row items-center gap-x-md px-5xl pt-lg">
                <GoBackButton onPress={handleCancel} />

                <View className="flex-1 flex-row items-center gap-x-md rounded-3xl border border-secondary-corner bg-secondary-background px-lg py-md">
                    <Icon icon={UserIconNameEnum.Archive} size={16} className="text-primary" />
                    <Text numberOfLines={1} className="text-primary text-xs font-semibold flex-1">
                        {backupFileName}
                    </Text>
                    <Text className="text-secondary-foreground text-xs">{backupFileSize}</Text>
                </View>
            </View>

            <View className="flex-1 px-6xl justify-center">
                <PinForm
                    title={t`Enter the PIN this backup was sealed with`}
                    description={t`If you don't remember it, this backup can't be opened. You can start fresh instead.`}
                    currentInput={input}
                    error={error}
                    isLoading={isLoading}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                />

                <Button variant="ghost" content={t`Start fresh instead`} onPress={handleCancel} className="mb-5xl" />

                {isLoading ? <LoadingOverlay /> : null}
            </View>
        </FullPage>
    );
}
