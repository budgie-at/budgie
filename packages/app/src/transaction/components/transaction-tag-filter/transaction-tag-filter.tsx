import { TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { useTransactionFilter } from '../../hook/use-transaction-filter.hook';
import { TransactionFilterRenderItemsArgsInterface } from '../../interface/transaction-filter-render-items-args.interface';
import { TransactionBaseSearchableFilter } from '../transaction-base-filter/transaction-base-searchable-filter';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';
import { TransactionFilterEmptyState } from '../transaction-filter-empty-state/transaction-filter-empty-state';

import { TransactionTagFilterItem } from './transaction-tag-filter-item';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionTagFilter = ({ value, onChange }: Props) => {
    const { ref, search, setSearch, handleOpen, handleNavigateToCreate } = useTransactionFilter('/tags');
    const { t } = useLingui();

    const { tags, total } = useSearchTagsQuery(search);

    const selectedTagsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTagsCount) ? t`Tags (${selectedTagsCount})` : t`Tags`;

    const renderItems = ({ items, onSelect, selectedIds }: TransactionFilterRenderItemsArgsInterface<TagEntityInterface>) => (
        <View>
            {items.map((tag, index) => (
                <TransactionTagFilterItem
                    tag={tag}
                    key={tag.id}
                    onSelect={onSelect}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    isSelected={selectedIds.includes(tag.id)}
                />
            ))}
        </View>
    );

    return (
        <>
            <TransactionFilterChip isActive={isPositiveNumber(selectedTagsCount)} icon="HashIcon" label={label} onPress={handleOpen} />

            <TransactionBaseSearchableFilter
                ref={ref}
                value={value}
                total={total}
                onChange={onChange}
                search={search}
                onSearchChange={setSearch}
                icon="HashIcon"
                items={tags ?? []}
                title={t`Tags`}
                renderItems={renderItems}
                emptySearchText={t`No tags found`}
                searchPlaceholder={t`Search tags...`}
                emptyState={
                    <TransactionFilterEmptyState
                        icon="HashIcon"
                        onCreate={handleNavigateToCreate}
                        title={t`No Tags Yet`}
                        buttonText={t`Create Tags`}
                        description={t`Create custom tags in Settings to label and filter your transactions`}
                    />
                }
            />
        </>
    );
};
