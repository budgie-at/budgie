import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { BankIntegrationKeyModalContext } from '../context/bank-integration-key-modal.context';

export const BankIntegrationKeyModalProvider = createModalProvider<number, null>(BankIntegrationKeyModalContext, '/bank-integration-key');
