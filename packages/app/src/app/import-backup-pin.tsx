import { useLingui } from '@lingui/react/macro';
import React, { useEffect, useEffectEvent, useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GoBackButton } from '../@generic/component/go-back-button/go-back-button';
import { LoadingOverlay } from '../@generic/component/loading-overlay/loading-overlay';
import { FullPage } from '../@generic/component/page/full-page';
import { PinForm } from '../auth/components/pin-form/pin-form';
import { PIN_LENGTH } from '../auth/constant/pin-length.constant';
import { useImportBackupPinModal } from '../import/context/import-backup-pin-modal.context';
import { databaseImportService } from '../import/service/database-import.service';

export default function ImportBackupPinModal() {
    const { t } = useLingui();
    const [, resolveImportBackupPin, sourceUri] = useImportBackupPinModal();

    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const submitPin = async (pin: string) => {
        if (!isNotEmptyString(sourceUri)) {
            return;
        }

        setIsLoading(true);

        const canOpenBackup = await databaseImportService.canOpenBackup(sourceUri, pin);

        setIsLoading(false);

        if (canOpenBackup) {
            resolveImportBackupPin(pin);

            return;
        }

        setInput('');
        setError(t`Incorrect PIN`);
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

    return (
        <FullPage>
            <GoBackButton onPress={handleCancel} className="absolute left-[20px] top-[20px]" />

            <View className="flex-1 px-6xl justify-center">
                <PinForm
                    title={t`Backup PIN`}
                    description={t`Enter the PIN this backup was created with. It becomes your app PIN after the restore.`}
                    currentInput={input}
                    error={error}
                    isLoading={isLoading}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                />

                {isLoading ? <LoadingOverlay /> : null}
            </View>
        </FullPage>
    );
}
