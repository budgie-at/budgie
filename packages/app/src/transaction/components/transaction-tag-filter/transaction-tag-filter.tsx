import { TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { FilterChip } from '../../../@generic/components/filter-chip/filter-chip';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchTagsLiveQuery } from '../../../tag/query/use-search-tags-live.query';
import { TransactionFilterRenderItemsArgsType } from '../../type/transaction-filter-render-items-args.type';
import { TransactionMultiSelectFilter } from '../transaction-base-filter/transaction-base-filter';
import { TransactionFilterEmptyState } from '../transaction-filter-empty-state/transaction-filter-empty-state';

import { TransactionTagFilterItem } from './transaction-tag-filter-item';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionTagFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const { t } = useLingui();

    const { tags } = useSearchTagsLiveQuery(search);

    const selectedTagsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTagsCount) ? t`Tags (${selectedTagsCount})` : t`Tags`;

    const handleOpen = () => void ref.current?.open();

    const handleNavigateToTags = () => {
        ref.current?.close();
        void router.push('/tags');
    };

    const renderItems = ({ items, onSelect, selectedIds }: TransactionFilterRenderItemsArgsType<TagEntityInterface>) => (
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
            <FilterChip isActive={isPositiveNumber(selectedTagsCount)} icon="HashIcon" label={label} onPress={handleOpen} />

            <TransactionMultiSelectFilter
                ref={ref}
                value={value}
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
                        onCreate={handleNavigateToTags}
                        title={t`No Tags Yet`}
                        buttonText={t`Create Tags`}
                        description={t`Create custom tags in Settings to label and filter your transactions`}
                    />
                }
            />
        </>
    );
};
