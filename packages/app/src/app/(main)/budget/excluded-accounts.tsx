import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ListRenderItemInfo } from '@react-native/virtualized-lists/Lists/VirtualizedList';
import { FlatList, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSearchAccountsGroupedQuery } from '../../../account/query/use-search-accounts-grouped.query';
import { ExcludedAccountCard } from '../../../budget/components/excluded-account-card/excluded-account-card';
import { useGetExcludedAccountIdsQuery } from '../../../budget/query/use-get-excluded-account-ids.query';

const listFooter = <MenuSpacer />;

export default function ExcludedAccountsPage() {
    const { t } = useLingui();

    const { accounts } = useSearchAccountsGroupedQuery();
    const { excludedAccountIds } = useGetExcludedAccountIdsQuery();

    const handleGoBack = () => void goBackOrReplace('/budget/settings');

    const renderAccount = ({ item }: ListRenderItemInfo<AccountWithInstrumentEntityInterface>) => (
        <ExcludedAccountCard account={item} isExcluded={excludedAccountIds.has(item.id)} />
    );

    return (
        <Page header={<PageHeader onGoBack={handleGoBack} title={t`Excluded Accounts`} />}>
            {isNotEmptyArray(accounts) ? (
                <FlatList
                    contentContainerClassName="gap-y-xl pt-5xl"
                    className="flex-1"
                    data={accounts}
                    renderItem={renderAccount}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>No accounts found</Trans>
                    </Text>
                </View>
            )}
        </Page>
    );
}
