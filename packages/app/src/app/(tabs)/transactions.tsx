import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Page } from '../../@generic/components/page/page';
import { Separator } from '../../@generic/components/separator/separator';
import { TransactionList } from '../../transaction/components/transaction-list/transaction-list';

export default function TransactionsPage() {
    return (
        <Page>
            <Text className="text-primary text-6xl mb-lg">
                <Trans>Transactions</Trans>
            </Text>

            <Separator />

            <View className='mt-5xl'>
                <TransactionList accountId={null} />
            </View>
        </Page>
    );
}
