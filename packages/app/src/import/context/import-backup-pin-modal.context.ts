import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export const [ImportBackupPinModalContext, useImportBackupPinModal] = createModalContext<string, string | null>(null);
