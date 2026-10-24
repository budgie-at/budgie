import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export const [BankIntegrationNameModalContext, useBankIntegrationNameModal, useBankIntegrationNameModalParams] = createModalContext<
    number,
    null
>(null);
