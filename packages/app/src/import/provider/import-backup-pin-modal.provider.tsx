import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ImportBackupPinModalContext } from '../context/import-backup-pin-modal.context';

export const ImportBackupPinModalProvider = createModalProvider<string, string | null>(ImportBackupPinModalContext, '/import-backup-pin');
