import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export const [ImportBackupPinModalContext, useImportBackupPinModal, useImportBackupPinModalParams] = createModalContext<
    string,
    string | null
>(null);
