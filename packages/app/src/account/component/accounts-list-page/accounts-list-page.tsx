import { AccountEntityInterface, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { ListRenderItemInfo } from '@react-native/virtualized-lists/Lists/VirtualizedList';
import { ReactElement, ReactNode } from 'react';
import { FlatList } from 'react-native';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { IconName } from '../../../@generic/constant/icons.constant';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';

type AccountType = AccountEntityInterface | AccountWithInstrumentEntityInterface;

interface Props<T extends AccountType> {
    readonly accounts: T[] | null;
    readonly title: string;
    readonly description: string;
    readonly icon: IconName;
    readonly emptyState: ReactNode;
    readonly renderCard: (account: T) => ReactElement;
}

const safeEdges: Edges = ['bottom'];
const listFooter = <SafeAreaView edges={safeEdges} />;

export const AccountsListPage = <T extends AccountType>(props: Props<T>) => {
    const { accounts, title, description, icon, emptyState, renderCard } = props;

    const handleGoBack = () => void goBackOrReplace('/settings');

    const renderAccount = ({ item }: ListRenderItemInfo<T>) => renderCard(item);

    return (
        <Page
            header={<PageHeader onGoBack={handleGoBack} iconVariant="dark-warning" description={description} icon={icon} title={title} />}
        >
            {isNotEmptyArray(accounts) ? (
                <FlatList
                    contentContainerClassName="gap-y-xl pt-5xl"
                    className="flex-1"
                    data={accounts}
                    renderItem={renderAccount}
                    ListFooterComponent={listFooter}
                />
            ) : (
                emptyState
            )}
        </Page>
    );
};
