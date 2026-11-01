import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationSheetFooter } from '../../../@generic/component/destination-sheet-footer/destination-sheet-footer';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { useDestinationSelection } from '../../../@generic/hook/use-destination-selection.hook';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { useCategoryFormModal } from '../../context/category-form-modal.context';
import { useCategoriesWithUsageQuery } from '../../query/use-categories-with-usage.query';
import { CategoryDestinationRow } from '../category-destination-row/category-destination-row';
import { CategoryEmptyState } from '../category-empty-state/category-empty-state';

import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly excludeCategoryIds: readonly number[];
    readonly commitLabel: string;
    readonly getCommitSummary: (destinationTitle: string) => string;
    readonly onSelect: (categoryId: number) => void;
}

export const CategoryDestinationSheet = (props: Props) => {
    const { title, description, excludeCategoryIds, commitLabel, getCommitSummary, onSelect } = props;
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const [search, setSearch] = useState('');
    const formatUsage = useFormatEntityUsage();
    const { categories, usage, isUsageFailure, retryUsage, isFailure, retry } = useCategoriesWithUsageQuery(search, true);

    const destinations = categories?.filter(category => !excludeCategoryIds.includes(category.id));
    const { selected, setSelected, isPending, handleRowSelect, handleCommit } = useDestinationSelection(destinations, onSelect);
    const sections = isDefined(destinations)
        ? [
              { title: t`Custom categories`, data: destinations.filter(category => !category.isDefault) },
              { title: t`Built-in`, data: destinations.filter(category => category.isDefault) }
          ]
        : null;
    const footer = isDefined(selected)
        ? { summary: getCommitSummary(selected.title), label: commitLabel }
        : { summary: null, label: t`Pick a category to continue` };

    const handleCreatePress = (defaultTitle: string) => {
        openCategoryForm({ defaultTitle }, result => {
            if (isDefined(result)) {
                setSelected(result.category);
            }
        });
    };

    const handleCreateFromSearch = () => void handleCreatePress(search.trim());

    const handleClearSearch = () => void setSearch('');

    const renderRow = (category: CategoryEntityInterface) => (
        <CategoryDestinationRow
            category={category}
            subtitle={formatUsage(usage?.find(entry => entry.id === category.id))}
            isSelected={selected?.id === category.id}
            isDisabled={isPending}
            onSelect={handleRowSelect}
        />
    );

    return (
        <DestinationSheet
            title={title}
            description={description}
            search={search}
            onSearchChange={setSearch}
            placeholder={t`Search categories…`}
            searchTestID={CategorySelectorModalSelector.Input}
            action={
                <SelectorCreateButton
                    label={t`Create category`}
                    onPress={handleCreateFromSearch}
                    testID={CategorySelectorModalSelector.CreateButton}
                />
            }
        >
            <DestinationList
                sections={sections}
                isFailure={isFailure}
                onRetry={retry}
                isUsageFailure={isUsageFailure}
                onRetryUsage={retryUsage}
                renderRow={renderRow}
                emptyState={<CategoryEmptyState search={search} onClearSearch={handleClearSearch} onCreate={handleCreatePress} />}
            />
            <DestinationSheetFooter summary={footer.summary}>
                <PillButton
                    label={footer.label}
                    variant="destructive"
                    isDisabled={!isDefined(selected)}
                    onPress={handleCommit}
                    testID={CategorySelectorModalSelector.CommitButton}
                />
            </DestinationSheetFooter>
        </DestinationSheet>
    );
};
