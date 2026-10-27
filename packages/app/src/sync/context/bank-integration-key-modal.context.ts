import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export const [BankIntegrationKeyModalContext, useBankIntegrationKeyModal, useBankIntegrationKeyModalParams] = createModalContext<
    number,
    null
>(null);
