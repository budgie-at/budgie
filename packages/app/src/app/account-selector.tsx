import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { AccountSelectContent } from '../account/component/account-select-content/account-select-content';
import { useAccountSelectorModal } from '../account/context/account-selector-modal.context';
import { useSearchAccountsSortedQuery } from '../account/query/use-search-accounts-sorted.query';
import { useThemeContext } from '../theme/context/theme.context';

import { AccountSelectorModalSelector } from './account-selector-modal.selector';

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

export default function AccountSelectorModal() {
    const { t } = useLingui();
    const [, resolveAccountSelector, currentParams] = useAccountSelectorModal();
    const { isDarkColorSchema } = useThemeContext();

    const [search, setSearch] = useState('');

    const containerStyle = { flex: 1, backgroundColor: isDarkColorSchema ? BG_DARK : BG_LIGHT };
    const createAction = currentParams?.createAction;

    const { accounts } = useSearchAccountsSortedQuery(search, {
        debtType: currentParams?.debtType,
        excludeAccountId: currentParams?.excludeAccountId,
        excludeTypes: currentParams?.excludeAccountTypes,
        includeTypes: currentParams?.includeAccountTypes,
        onlyActive: currentParams?.onlyActive ?? true
    });

    const handleCreateAction = () => {
        if (!isDefined(createAction)) {
            return;
        }

        createAction
            .onCreate()
            .then(() => void resolveAccountSelector(null))
            .catch(() => void Toast.show({ type: 'error', text1: createAction.errorMessage }));
    };
    const contentCreateAction = isDefined(createAction)
        ? {
              title: createAction.title,
              subtitle: createAction.subtitle,
              errorMessage: createAction.errorMessage,
              onCreate: handleCreateAction
          }
        : void 0;

    return (
        <View style={containerStyle} collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search accounts...`}
                testID={AccountSelectorModalSelector.Input}
            />

            <AccountSelectContent
                data={accounts}
                initialAccountId={currentParams?.initialAccountId ?? null}
                search={search}
                onSelect={resolveAccountSelector}
                emptyStateDescription={currentParams?.emptyStateDescription}
                showDebtTotal={currentParams?.showDebtTotal ?? false}
                createAction={contentCreateAction}
            />
        </View>
    );
}
