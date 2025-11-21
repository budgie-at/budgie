import { useLingui } from '@lingui/react/macro';
import React from 'react';
import { SectionList, Text, View } from 'react-native';

import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetTransactionEntriesQuery } from '../../query/use-get-transaction-entries.query';
import { TransactionEntryCard } from '../transaction-entry-card/transaction-entry-card';

const SectionHeader = ({ date }: { date: string }) => {
    const { formatMonthAndYear } = useFormatDate();

    return (
        <View className="bg-primary-reverse">
            <Text className="text-secondary-foreground uppercase text-xs">{formatMonthAndYear(date)}</Text>
        </View>
    );
};

export const TransactionEntryList = () => {
    const { sections, loadMore } = useGetTransactionEntriesQuery();
    const { t } = useLingui();

    const listSections = sections.map(s => ({ title: s.date, data: s.entries }));

    const renderItem = ({ item }: { item: TransactionEntryEntityInterface }) => <TransactionEntryCard entry={item} />;
    const keyExtractor = (item: TransactionEntryEntityInterface) => item.id.toString();
    const renderSectionHeader = ({ section }: { section: { title: string } }) => <SectionHeader date={section.title} />;

    const listEmptyState = (
        <EmptyState
            circleIcon="Receipt"
            title={t`No transactions yet`}
            titleClassName="text-md text-primary font-semibold"
            description={t`Start tracking your spending by using the mic button or adding transactions manually`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    return (
        <SectionList
            showsVerticalScrollIndicator={false}
            style={{ marginTop: 20 }}
            contentContainerClassName="pt-5xl gap-y-xl"
            sections={listSections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={listEmptyState}
        />
    );
};
