import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ListRenderItemInfo } from '@react-native/virtualized-lists/Lists/VirtualizedList';
import { FlatList } from 'react-native';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../@generic/components/page/page';
import { PageHeader } from '../../@generic/components/page-header/page-header';
import { ArchivedAccountCard } from '../../account/component/archived-account-card/archived-account-card';
import { ArchivedAccountsEmptyState } from '../../account/component/archived-accounts-empty-state/archived-accounts-empty-state';
import { useGetArchivedAccountsQuery } from '../../account/query/use-get-archived-accounts.query';

const safeEdges: Edges = ['bottom'];
const listFooter = <SafeAreaView edges={safeEdges} />;

export default function Archived() {
    const { accounts } = useGetArchivedAccountsQuery();
    const { t } = useLingui();

    const archivedAccountsCount = accounts?.length ?? 0;

    const renderAccount = ({ item }: ListRenderItemInfo<AccountEntityInterface>) => <ArchivedAccountCard account={item} />;

    return (
        <Page header={<PageHeader showBackBtn iconVariant="dark-warning" description={t`${archivedAccountsCount} account`} icon="Archive" title={t`Archived Accounts`} />}>
            {isNotEmptyArray(accounts) ? (
                <FlatList
                    contentContainerClassName="gap-y-xl pt-5xl"
                    className="flex-1"
                    data={accounts}
                    renderItem={renderAccount}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <ArchivedAccountsEmptyState />
            )}
        </Page>
    );
}
