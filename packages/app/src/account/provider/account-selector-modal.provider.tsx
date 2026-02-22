import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { AccountSelectorModalContext } from '../context/account-selector-modal.context';

import type { AccountSelectorModalParams, AccountSelectorResult } from '../context/account-selector-modal.context';

export const AccountSelectorModalProvider = createModalProvider<AccountSelectorModalParams, AccountSelectorResult>(
    AccountSelectorModalContext,
    '/account-selector'
);
