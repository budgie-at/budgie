import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { BankIntegrationNameModalContext } from '../context/bank-integration-name-modal.context';

export const BankIntegrationNameModalProvider = createModalProvider<number, null>(
    BankIntegrationNameModalContext,
    '/bank-integration-name'
);
