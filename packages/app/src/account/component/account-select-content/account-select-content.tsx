import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useThemeContext } from '../../../theme/context/theme.context';
import { AccountSelectorCard } from '../account-selector-card/account-selector-card';

interface Props {
    readonly data: AccountWithInstrumentEntityInterface[];
    readonly initialAccountId: number | null;
    readonly search: string;
    readonly onSelect: (accountId: number) => void;
    readonly emptyStateDescription?: string;
}

const HEADER_OFFSET = 88;
const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

const keyExtractor = (item: AccountWithInstrumentEntityInterface) => item.id.toString();

export const AccountSelectContent = (props: Props) => {
    const { data, initialAccountId, search, onSelect, emptyStateDescription } = props;

    /* jscpd:ignore-start - FormSheet modal pattern from docs/plans/2025-01-24-formsheet-modal-learnings.md */
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();

    const backgroundColor = isDarkColorSchema ? BG_DARK : BG_LIGHT;
    const flatListStyle = [StyleSheet.absoluteFill, { backgroundColor }];
    const contentContainerStyle = { paddingTop: HEADER_OFFSET, paddingBottom: bottom, flexGrow: 1 };
    /* jscpd:ignore-end */

    const renderItem = ({ item }: { item: AccountWithInstrumentEntityInterface }) => (
        <AccountSelectorCard
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
            contentContainerClassName="px-xl pt-3 gap-y-lg"
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
