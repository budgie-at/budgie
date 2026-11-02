import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { SelectorSearchEmptyState } from '../../../@generic/component/selector-search-empty-state/selector-search-empty-state';
import { LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { SELECTOR_TITLED_HEADER_OFFSET } from '../../../@generic/constant/selector-header-offset.constant';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { AccountSelectorCard } from '../account-selector-card/account-selector-card';
import { AccountSelectorCreateActionCard } from '../account-selector-create-action-card/account-selector-create-action-card';

import type { AccountSelectorCreateActionInterface } from '../../interface/account-selector-create-action.interface';

interface Props {
    readonly data: AccountWithInstrumentEntityInterface[];
    readonly initialAccountId: number | null;
    readonly search: string;
    readonly onSelect: (accountId: number) => void;
    readonly emptyStateDescription?: string;
    readonly showDebtTotal: boolean;
    readonly createAction?: Pick<AccountSelectorCreateActionInterface, 'title' | 'subtitle'> & {
        readonly onCreate: () => void;
    };
}

const keyExtractor = (item: AccountWithInstrumentEntityInterface) => item.id.toString();

export const AccountSelectContent = (props: Props) => {
    const { data, initialAccountId, search, onSelect, emptyStateDescription, showDebtTotal, createAction } = props;
    const { t } = useLingui();
    const contentContainerStyle = useFormsheetListContentStyle(0, SELECTOR_TITLED_HEADER_OFFSET);

    const renderItem = ({ item, index }: { item: AccountWithInstrumentEntityInterface; index: number }) => (
        <GroupedListItem isFirst={index === 0} isLast={index === data.length - 1}>
            <AccountSelectorCard
                isSelected={item.id === initialAccountId}
                instrument={item.instrument}
                isActive={item.isActive}
                onSelect={onSelect}
                title={item.title}
                icon={item.icon}
                type={item.type}
                id={item.id}
                debtType={item.debtType}
                showDebtTotal={showDebtTotal}
                targetBalance={item.targetBalance}
            />
        </GroupedListItem>
    );

    const listEmptyComponent = isNotEmptyString(search) ? (
        <View className="pt-7xl">
            <SelectorSearchEmptyState query={search.trim()} hint={t`Check the spelling or try another account name.`} />
        </View>
    ) : (
        <View className="flex-1 justify-center">
            <EmptyState
                icon={UserIconNameEnum.Wallet}
                title={t`No accounts yet`}
                description={emptyStateDescription ?? t`Create one to get started.`}
            />
        </View>
    );
    const listHeaderComponent =
        isNotEmptyString(search) || !createAction ? null : (
            <AccountSelectorCreateActionCard title={createAction.title} subtitle={createAction.subtitle} onCreate={createAction.onCreate} />
        );

    return (
        <View className="absolute inset-0">
            <BudgieLegendList
                style={LEGEND_LIST_STYLE}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={contentContainerStyle}
                ListHeaderComponent={listHeaderComponent}
                ListEmptyComponent={listEmptyComponent}
            />
        </View>
    );
};
