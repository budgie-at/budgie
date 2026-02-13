import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { TransactionFormSelectors } from '../@e2e/selectors/transaction-form.selector';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { AccountSelectContent } from '../account/component/account-select-content/account-select-content';
import { useAccountSelectorModal } from '../account/context/account-selector-modal.context';
import { useSearchAccountsSortedQuery } from '../account/query/use-search-accounts-sorted.query';
import { useThemeContext } from '../theme/context/theme.context';

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

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

    return (
        <View style={containerStyle}>
            <SelectorModalSearchHeader
                testID={TransactionFormSelectors.AccountSearchInput}
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search accounts...`}
            />

            <AccountSelectContent
                data={accounts}
                initialAccountId={initialAccountId}
                search={search}
                onSelect={resolveAccountSelector}
                emptyStateDescription={emptyStateDescription}
            />
        </View>
    );
}
