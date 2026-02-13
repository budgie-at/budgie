import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { AccountPickerBottomSheetSelectors } from '../../../@e2e/selectors/account-picker-bottom-sheet.selector';
import { TransactionFormSelectors } from '../../../@e2e/selectors/transaction-form.selector';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { AccountSelectorCard } from '../account-selector-card/account-selector-card';

interface Props {
    readonly data: AccountWithInstrumentEntityInterface[];
    readonly initialAccountId: number | null;
    readonly search: string;
    readonly onSelect: (accountId: number) => void;
    readonly emptyStateDescription?: string;
}

const keyExtractor = (item: AccountWithInstrumentEntityInterface) => item.id.toString();

export const AccountSelectContent = (props: Props) => {
    const { data, initialAccountId, search, onSelect, emptyStateDescription } = props;
    const { t } = useLingui();
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles();

    const getCardTestID = (index: number): string =>
        index === 0 ? TransactionFormSelectors.Account : AccountPickerBottomSheetSelectors.Card(index);

    const renderItem = ({ item, index }: { item: AccountWithInstrumentEntityInterface; index: number }) => (
        <AccountSelectorCard
            testID={getCardTestID(index)}
            isSelected={item.id === initialAccountId}
            instrument={item.instrument}
            onSelect={onSelect}
            title={item.title}
            icon={item.icon}
            type={item.type}
            id={item.id}
        />
    );

    const emptyIcon = isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.Wallet;
    const emptyTitle = isNotEmptyString(search) ? t`No accounts found` : t`No accounts yet`;
    const emptyDescription = isNotEmptyString(search)
        ? t`Try a different search term`
        : (emptyStateDescription ?? t`Create one to get started.`);

    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </View>
    );

    return (
        <FlatList
            style={flatListStyle}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
            ItemSeparatorComponent={ListItemSeparator}
        />
    );
};
