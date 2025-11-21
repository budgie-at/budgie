import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import { Page } from '../../@generic/components/page/page';
import { Separator } from '../../@generic/components/separator/separator';
import { useGetTransactionEntriesQuery } from '../../transaction-entry/query/use-get-transaction-entries.query';
import { TransactionEntryList } from '../../transaction-entry/components/transaction-entry-list/transaction-entry-list';

export default function TransactionsPage() {
    const { entries } = useGetTransactionEntriesQuery();
    const { t } = useLingui();

    return (
        <Page>
            <Text className="text-primary text-6xl mb-lg">
                <Trans>Transactions</Trans>
            </Text>

            <Separator />

            <TransactionEntryList />
            {/*<AnimatedHeaderedScrollView title={t`Transactions`}>*/}

            {/*    {isNotEmptyArray(entries) ? (*/}
            {/*        <View className="py-5xl gap-y-md">*/}
            {/*            {entries.map(entry => (*/}
            {/*                <TransactionEntryCard key={entry.id} entry={entry} />*/}
            {/*            ))}*/}
            {/*        </View>*/}
            {/*    ) : (*/}
            {/*        <EmptyState*/}
            {/*            circleIcon="Receipt"*/}
            {/*            title={t`No transactions yet`}*/}
            {/*            titleClassName="text-md text-primary font-semibold"*/}
            {/*            description={t`Start tracking your spending by using the mic button or adding transactions manually`}*/}
            {/*            descriptionClassName="text-center max-w-[250px]"*/}
            {/*        />*/}
            {/*    )}*/}
            {/*</AnimatedHeaderedScrollView>*/}
        </Page>
    );
}
