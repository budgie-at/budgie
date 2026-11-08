import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationSheetFooter } from '../../../@generic/component/destination-sheet-footer/destination-sheet-footer';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { useDestinationSelection } from '../../../@generic/hook/use-destination-selection.hook';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { useCategoriesWithUsageQuery } from '../../query/use-categories-with-usage.query';
import { CategoryDestinationRow } from '../category-destination-row/category-destination-row';
import { CategoryEmptyState } from '../category-empty-state/category-empty-state';

import type { DestinationSelectionInterface } from '../../../@generic/interface/destination-selection.interface';
import type { CategoryDestinationParamsInterface } from '../../interface/category-destination-params.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly params: CategoryDestinationParamsInterface;
    readonly selection: DestinationSelectionInterface;
    readonly onCommit: (categoryId: number) => void;
    readonly onCreate: (defaultTitle: string) => void;
}

export const CategoryDestinationSheet = (props: Props) => {
    const { params, selection, onCommit, onCreate } = props;
    const { title, description, excludeCategoryIds, syncZone, commitLabel, getCommitCopy } = params;
    const { t } = useLingui();
    const { search, onSearchChange } = selection;
    const formatUsage = useFormatEntityUsage();
    const { categories, usage, isUsageFailure, retryUsage, isFailure, retry } = useCategoriesWithUsageQuery(search, true, syncZone);

    const destinations = categories?.filter(category => !excludeCategoryIds.includes(category.id));
    const { selected, isPending, handleRowSelect, handleCommit } = useDestinationSelection(destinations, selection, onCommit);
    const sections = isDefined(destinations)
        ? [
              { title: t`Custom categories`, data: destinations.filter(category => !category.isDefault) },
              { title: t`Built-in`, data: destinations.filter(category => category.isDefault) }
          ]
        : null;
    const commitCopy = isDefined(selected) ? getCommitCopy(selected.title) : null;

    const handleCreateFromSearch = () => void onCreate(search.trim());

    const handleClearSearch = () => void onSearchChange('');

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
            onSearchChange={onSearchChange}
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
                emptyState={<CategoryEmptyState search={search} onClearSearch={handleClearSearch} onCreate={onCreate} />}
            />
            <DestinationSheetFooter
                commitCopy={commitCopy}
                commitLabel={commitLabel}
                pickLabel={t`Pick a category to continue`}
                onCommit={handleCommit}
                testID={CategorySelectorModalSelector.CommitButton}
            />
        </DestinationSheet>
    );
};
