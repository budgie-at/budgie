import { isEmojiIcon } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { DestinationSheetFooter } from '../../../@generic/component/destination-sheet-footer/destination-sheet-footer';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useDestinationSelection } from '../../../@generic/hook/use-destination-selection.hook';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { useCategoryFormModal } from '../../context/category-form-modal.context';
import { useCategoriesWithUsageQuery } from '../../query/use-categories-with-usage.query';
import { CategoryEmptyState } from '../category-empty-state/category-empty-state';

import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly excludeCategoryIds: readonly number[];
    readonly getCommitLabel: (destinationTitle: string) => string;
    readonly onSelect: (categoryId: number) => void;
}

export const CategoryDestinationSheet = (props: Props) => {
    const { title, description, excludeCategoryIds, getCommitLabel, onSelect } = props;
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
    const commitLabel = isDefined(selected) ? getCommitLabel(selected.title) : t`Pick a category to continue`;

    const handleCreatePress = (defaultTitle: string) => {
        openCategoryForm({ defaultTitle }, result => {
            if (isDefined(result)) {
                setSelected(result.category);
            }
        });
    };

    const handleCreateFromSearch = () => void handleCreatePress(search.trim());

    const handleClearSearch = () => void setSearch('');

    const renderRow = (category: CategoryEntityInterface) => {
        const iconSize = isEmojiIcon(category.icon) ? 22 : 18;

        return (
            <DestinationRow
                id={category.id}
                title={category.title}
                subtitle={formatUsage(usage?.find(entry => entry.id === category.id))}
                left={
                    <CircleIcon
                        icon={category.icon}
                        variant="secondary"
                        size={36}
                        iconSize={iconSize}
                        radius={18}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.secondary}
                    />
                }
                isSelected={selected?.id === category.id}
                isDisabled={isPending}
                onSelect={handleRowSelect}
                testID={CategorySelectorModalSelector.Card(category.title)}
            />
        );
    };

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
            <DestinationSheetFooter
                label={commitLabel}
                isDisabled={!isDefined(selected)}
                onPress={handleCommit}
                testID={CategorySelectorModalSelector.CommitButton}
            />
        </DestinationSheet>
    );
};
