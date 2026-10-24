import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ModalRequestInterface } from '../../../@generic/interface/modal-request.interface';
import { ImportBackupPin } from '../../../import/component/import-backup-pin/import-backup-pin';
import { ImportBackupPinModalContext } from '../../../import/context/import-backup-pin-modal.context';
import { ForgotPinSheet } from '../forgot-pin-sheet/forgot-pin-sheet';
import { PinUnlock } from '../pin-unlock/pin-unlock';

export const AppLockContent = () => {
    const [isRecovering, setIsRecovering] = useState(false);
    const [request, setRequest] = useState<ModalRequestInterface<string, string | null> | null>(null);
    const [BackupPinContext] = ImportBackupPinModalContext;

    const handleOpenBackup = (params?: string, onResult?: (pin: string | null) => void) => {
        setRequest({ params: params ?? null, onResult });
    };
    const handleResolveBackup = (pin: string | null) => {
        setRequest(null);
        request?.onResult?.(pin);
    };
    const handleDismissBackup = () => void handleResolveBackup(null);
    const handleForgotPin = () => void setIsRecovering(true);
    const handleTryAgain = () => void setIsRecovering(false);

    const backupPinContext = [handleOpenBackup, handleResolveBackup, handleDismissBackup] as const;

    useEffect(() => void Keyboard.dismiss(), []);

    if (isDefined(request)) {
        return <ImportBackupPin sourceUri={request.params} onResult={handleResolveBackup} />;
    }

    if (isRecovering) {
        return (
            <BackupPinContext value={backupPinContext}>
                <ForgotPinSheet onTryAgain={handleTryAgain} />
            </BackupPinContext>
        );
    }

    return <PinUnlock onForgotPin={handleForgotPin} />;
};
