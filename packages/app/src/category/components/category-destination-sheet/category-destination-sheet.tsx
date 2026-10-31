import { isEmojiIcon, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { useCategoryFormModal } from '../../context/category-form-modal.context';
import { categoryUsageAtom } from '../../query/use-custom-categories-with-usage.query';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';

import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly excludeCategoryIds: readonly number[];
    readonly onSelect: (categoryId: number) => void;
}

export const CategoryDestinationSheet = (props: Props) => {
    const { title, description, excludeCategoryIds, onSelect } = props;
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const [search, setSearch] = useState('');
    const formatUsage = useFormatEntityUsage();
    const { categories, isFailure, retry } = useSearchCategoriesQuery(search, true);
    const usage = AsyncResult.getOrElse(useLiveAtomValue(categoryUsageAtom), () => []);

    const destinations = categories?.filter(category => !excludeCategoryIds.includes(category.id));
    const sections = isDefined(destinations)
        ? [
              { title: t`Custom categories`, data: destinations.filter(category => !category.isDefault) },
              { title: t`Built-in`, data: destinations.filter(category => category.isDefault) }
          ]
        : null;

    const handleCreatePress = () => {
        openCategoryForm({ defaultTitle: search }, result => {
            if (isDefined(result)) {
                onSelect(result.category.id);
            }
        });
    };

    const renderRow = (category: CategoryEntityInterface) => {
        const iconSize = isEmojiIcon(category.icon) ? 22 : 18;

        return (
            <DestinationRow
                key={category.id}
                id={category.id}
                title={category.title}
                subtitle={formatUsage(usage.find(entry => entry.id === category.id))}
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
                onSelect={onSelect}
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
                    onPress={handleCreatePress}
                    testID={CategorySelectorModalSelector.CreateButton}
                />
            }
        >
            <DestinationList
                sections={sections}
                isFailure={isFailure}
                onRetry={retry}
                renderRow={renderRow}
                emptyState={
                    <SearchablePageEmptyState
                        icon={UserIconNameEnum.Search}
                        title={t`No categories found`}
                        description={t`Try a different search term`}
                    />
                }
            />
        </DestinationSheet>
    );
};
