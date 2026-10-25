import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { ImportBackupPin } from '../import/component/import-backup-pin/import-backup-pin';
import { useImportBackupPinModal, useImportBackupPinModalParams } from '../import/context/import-backup-pin-modal.context';

export default function ImportBackupPinModal() {
    const [, resolveImportBackupPin, dismissImportBackupPin] = useImportBackupPinModal();
    const sourceUri = useImportBackupPinModalParams();

    useModalDismiss(dismissImportBackupPin);

    return <ImportBackupPin sourceUri={sourceUri} onResult={resolveImportBackupPin} />;
}
