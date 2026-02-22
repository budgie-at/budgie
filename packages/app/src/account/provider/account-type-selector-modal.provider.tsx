import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { AccountTypeSelectorModalContext } from '../context/account-type-selector-modal.context';

import type { AccountTypeSelectorModalParams, AccountTypeSelectorResult } from '../context/account-type-selector-modal.context';

export const AccountTypeSelectorModalProvider = createModalProvider<AccountTypeSelectorModalParams, AccountTypeSelectorResult>(
    AccountTypeSelectorModalContext,
    '/account-type-selector'
);
