import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { SelectorList } from '../../../@generic/component/selector-list/selector-list';
import { SelectorSearchEmptyState } from '../../../@generic/component/selector-search-empty-state/selector-search-empty-state';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { AccountSelectorCard } from '../account-selector-card/account-selector-card';
import { AccountSelectorCreateActionCard } from '../account-selector-create-action-card/account-selector-create-action-card';

import type { AccountSelectorCreateActionInterface } from '../../interface/account-selector-create-action.interface';

interface Props {
    readonly data: AccountWithInstrumentEntityInterface[];
    readonly initialAccountId: number | null;
    readonly search: string;
    readonly isLoading?: boolean;
    readonly onSelect: (accountId: number) => void;
    readonly emptyStateDescription?: string;
    readonly showDebtTotal: boolean;
    readonly createAction?: Pick<AccountSelectorCreateActionInterface, 'title' | 'subtitle'> & {
        readonly isDisabled?: boolean;
        readonly onCreate: () => void;
    };
}

const keyExtractor = (item: AccountWithInstrumentEntityInterface) => item.id.toString();

export const AccountSelectContent = (props: Props) => {
    const { data, initialAccountId, search, isLoading = false, onSelect, emptyStateDescription, showDebtTotal, createAction } = props;
    const { t } = useLingui();
    const contentContainerStyle = useFormsheetListContentStyle();

    const renderItem = ({ item, index }: { item: AccountWithInstrumentEntityInterface; index: number }) => (
        <GroupedListItem isFirst={index === 0} isLast={index === data.length - 1}>
            <AccountSelectorCard
                isSelected={item.id === initialAccountId}
                account={item}
                onSelect={onSelect}
                showDebtTotal={showDebtTotal}
            />
        </GroupedListItem>
    );

    const listEmptyComponent = isNotEmptyString(search) ? (
        <SelectorSearchEmptyState query={search.trim()} hint={t`Check the spelling or try another account name.`} />
    ) : (
        <View className="flex-1 justify-center">
            <EmptyState
                icon={UserIconNameEnum.Wallet}
                title={t`No accounts yet`}
                description={emptyStateDescription ?? t`Create one to get started.`}
            />
        </View>
    );
    const isCreateActionDisabled = createAction?.isDisabled ?? false;
    const createActionPointerEvents = isCreateActionDisabled ? 'none' : 'auto';
    const createActionClassName = isCreateActionDisabled ? 'opacity-50' : void 0;
    const createActionAccessibilityState = { disabled: isCreateActionDisabled, busy: isCreateActionDisabled };
    const listHeaderComponent =
        isNotEmptyString(search) || !createAction ? null : (
            <View
                pointerEvents={createActionPointerEvents}
                className={createActionClassName}
                accessibilityState={createActionAccessibilityState}
            >
                <AccountSelectorCreateActionCard
                    title={createAction.title}
                    subtitle={createAction.subtitle}
                    onCreate={createAction.onCreate}
                />
            </View>
        );

    const listOptions = {
        contentContainerStyle,
        ListHeaderComponent: listHeaderComponent,
        ListEmptyComponent: listEmptyComponent
    };
    const selectedIndex = data.findIndex(account => account.id === initialAccountId);

    return (
        <SelectorList
            isLoading={isLoading}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            options={listOptions}
            selectedIndex={selectedIndex}
        />
    );
};
