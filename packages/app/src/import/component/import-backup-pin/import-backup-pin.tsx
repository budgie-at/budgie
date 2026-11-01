import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FileChip } from '../../../@generic/component/file-chip/file-chip';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { FullPage } from '../../../@generic/component/page/full-page';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { PinFormHeader } from '../../../auth/components/pin-form-header/pin-form-header';
import { PinForm } from '../../../auth/components/pin-form/pin-form';
import { PIN_LENGTH } from '../../../auth/constant/pin-length.constant';
import { getPinFormStatus } from '../../../auth/utils/get-pin-form-status.util';
import { DatabaseImportService } from '../../service/database-import.service';

import { ImportBackupPinSelector } from './import-backup-pin.selector';

interface Props {
    readonly sourceUri: string | null;
    readonly onResult: (pin: string | null) => void;
}

export const ImportBackupPin = ({ sourceUri, onResult }: Props) => {
    const { t } = useLingui();
    const formatFileSize = useFormatFileSize();

    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { isLoading, run } = useSingleFlight();

    const submitPin = (pin: string) =>
        run(
            Effect.gen(function* () {
                if (!isNotEmptyString(sourceUri)) {
                    return;
                }

                const databaseImportService = yield* DatabaseImportService;
                const backupError = yield* databaseImportService.canOpenBackup(sourceUri, pin).pipe(
                    Effect.map(canOpenBackup => (canOpenBackup ? null : t`Incorrect PIN`)),
                    Effect.catchTags({
                        BackupArchiveMissingDatabaseError: () => Effect.succeed(t`This backup archive does not contain a Budgie database.`),
                        InsufficientStorageError: () => Effect.succeed(t`Not enough free storage to extract this backup.`),
                        UnsupportedBackupError: () =>
                            Effect.succeed(t`This backup was made by an older Budgie version and cannot be imported.`)
                    })
                );

                if (!isDefined(backupError)) {
                    onResult(pin);

                    return;
                }

                setInput('');
                setError(backupError);
            })
        );

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

    const handleCancel = () => void onResult(null);

    const backupFile = isNotEmptyString(sourceUri) ? new File(sourceUri) : null;
    const backupFileName = isDefined(backupFile) ? decodeURIComponent(backupFile.name) : '';
    const backupFileSize = isDefined(backupFile) && backupFile.exists ? formatFileSize(backupFile.size) : '';

    const pinFormStatus = getPinFormStatus(isLoading, false);

    return (
        <FullPage>
            <View className="flex-row items-center gap-x-md px-5xl pt-lg">
                <GoBackButton onPress={handleCancel} disabled={isLoading} />

                <FileChip icon={UserIconNameEnum.Archive} name={backupFileName}>
                    <Text className="ml-auto text-secondary-foreground text-xs">{backupFileSize}</Text>
                </FileChip>
            </View>

            <View className="flex-1 px-5xl">
                <PinForm
                    header={
                        <PinFormHeader
                            title={t`Enter the backup's PIN`}
                            description={t`Use the PIN this backup was sealed with. Without it, the backup can't be opened.`}
                            icon={null}
                        />
                    }
                    currentInput={input}
                    error={error}
                    status={pinFormStatus}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                    footer={
                        <Button
                            testID={ImportBackupPinSelector.StartFreshButton}
                            variant="ghost"
                            content={t`Start fresh instead`}
                            onPress={handleCancel}
                            disabled={isLoading}
                            className="self-center border-0 bg-transparent px-5xl min-h-[44px]"
                        />
                    }
                />
            </View>
        </FullPage>
    );
};
