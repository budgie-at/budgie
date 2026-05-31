import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { AccountSelectContent } from '../account/component/account-select-content/account-select-content';
import { useAccountSelectorModal } from '../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../account/query/use-get-account-by-id.query';
import { useSearchAccountsSortedQuery } from '../account/query/use-search-accounts-sorted.query';
import { useThemeContext } from '../theme/context/theme.context';

import { AccountSelectorModalSelector } from './account-selector-modal.selector';

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

// eslint-disable-next-line max-statements -- Selector modal orchestrating search, filters and pinned current selection
export default function AccountSelectorModal() {
    const { t } = useLingui();
    const [, resolveAccountSelector, currentParams] = useAccountSelectorModal();
    const { isDarkColorSchema } = useThemeContext();

    const [search, setSearch] = useState('');

    const backgroundColor = isDarkColorSchema ? BG_DARK : BG_LIGHT;
    const containerStyle = { flex: 1, backgroundColor };

    const initialAccountId = currentParams?.initialAccountId ?? null;
    const excludeAccountId = currentParams?.excludeAccountId;
    const excludeAccountTypes = currentParams?.excludeAccountTypes;
    const emptyStateDescription = currentParams?.emptyStateDescription;
    const onlyActive = currentParams?.onlyActive ?? true;

    const { accounts } = useSearchAccountsSortedQuery(search, { excludeAccountId, excludeTypes: excludeAccountTypes, onlyActive });
    const { account: currentAccount } = useGetAccountByIdQuery(initialAccountId ?? 0, true);

    const isCurrentAccountListed = isDefined(currentAccount) && accounts.some(account => account.id === currentAccount.id);
    const pinnedAccounts = isDefined(currentAccount) && !isCurrentAccountListed && !isNotEmptyString(search) ? [currentAccount] : [];
    const data = [...pinnedAccounts, ...accounts];

    return (
        <View style={containerStyle} collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search accounts...`}
                testID={AccountSelectorModalSelector.Input}
            />

            <AccountSelectContent
                data={data}
                initialAccountId={initialAccountId}
                search={search}
                onSelect={resolveAccountSelector}
                emptyStateDescription={emptyStateDescription}
            />
        </View>
    );
}
