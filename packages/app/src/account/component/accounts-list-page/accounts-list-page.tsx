import { AccountEntityInterface, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { ListRenderItemInfo } from '@react-native/virtualized-lists/Lists/VirtualizedList';
import { ReactElement, ReactNode } from 'react';
import { FlatList } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';

type AccountType = AccountEntityInterface | AccountWithInstrumentEntityInterface;

interface Props<T extends AccountType> {
    readonly accounts: T[] | null;
    readonly title: string;
    readonly renderCard: (account: T) => ReactElement;
    readonly children: ReactNode;
}

const listFooter = <MenuSpacer />;

export const AccountsListPage = <T extends AccountType>(props: Props<T>) => {
    const { accounts, title, renderCard, children } = props;

    const handleGoBack = () => void goBackOrReplace('/settings');

    const renderAccount = ({ item }: ListRenderItemInfo<T>) => renderCard(item);

    return (
        <Page header={<PageHeader onGoBack={handleGoBack} title={title} />}>
            {isNotEmptyArray(accounts) ? (
                <FlatList
                    contentContainerClassName="gap-y-xl pt-5xl"
                    className="flex-1"
                    data={accounts}
                    renderItem={renderAccount}
                    ListFooterComponent={listFooter}
                />
            ) : (
                children
            )}
        </Page>
    );
};
