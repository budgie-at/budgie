import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { ImportBackupPin } from '../import/component/import-backup-pin/import-backup-pin';

export default function ImportBackupPinModal() {
    const { params: sourceUri, resolve: resolveImportBackupPin } = useModalRoute('/import-backup-pin');

    return <ImportBackupPin sourceUri={sourceUri} onResult={resolveImportBackupPin} />;
}
