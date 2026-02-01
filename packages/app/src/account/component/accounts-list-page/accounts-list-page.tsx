import { AccountEntityInterface, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { LegendList } from '@legendapp/list';
import { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';

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

const ESTIMATED_ITEM_SIZE = 60;
const LIST_STYLE = { flex: 1 };
const CONTENT_CONTAINER_STYLE = { gap: 12 };

const keyExtractor = (item: AccountType) => item.id.toString();

const HEADER_SPACER_STYLE = { height: 80 };

const listHeader = <View style={HEADER_SPACER_STYLE} />;
const listFooter = <MenuSpacer />;

export const AccountsListPage = <T extends AccountType>(props: Props<T>) => {
    const { accounts, title, renderCard, children } = props;

    const handleGoBack = () => void goBackOrReplace('/settings');

    const renderAccount = ({ item }: { item: T }) => renderCard(item);

    return (
        <Page withBlur header={<PageHeader onGoBack={handleGoBack} title={title} />}>
            {isNotEmptyArray(accounts) ? (
                <LegendList
                    style={LIST_STYLE}
                    contentContainerStyle={CONTENT_CONTAINER_STYLE}
                    ListHeaderComponent={listHeader}
                    data={accounts}
                    renderItem={renderAccount}
                    keyExtractor={keyExtractor}
                    estimatedItemSize={ESTIMATED_ITEM_SIZE}
                    recycleItems
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={listFooter}
                />
            ) : (
                children
            )}
        </Page>
    );
};
