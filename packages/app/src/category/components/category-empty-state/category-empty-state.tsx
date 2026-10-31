import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyStateActions } from '../../../@generic/component/searchable-page-empty-state-actions/searchable-page-empty-state-actions';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { useCategoryFormModal } from '../../context/category-form-modal.context';

interface Props {
    readonly search: string;
    readonly onClearSearch: EmptyFn;
}

export const CategoryEmptyState = ({ search, onClearSearch }: Props) => {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();
    const trimmedSearch = search.trim();

    const handleCreate = () => void openCategoryForm({ defaultTitle: trimmedSearch });

    if (isNotEmptyString(trimmedSearch)) {
        return (
            <SearchablePageEmptyState
                icon={UserIconNameEnum.Search}
                title={t`No custom categories match “${trimmedSearch}”`}
                description={t`Check the spelling or create it as a new category.`}
            >
                <SearchablePageEmptyStateActions
                    createLabel={t`Create “${trimmedSearch}”`}
                    onCreate={handleCreate}
                    onClearSearch={onClearSearch}
                />
            </SearchablePageEmptyState>
        );
    }

    return (
        <SearchablePageEmptyState
            icon={UserIconNameEnum.Folder}
            title={t`No custom categories yet`}
            description={t`Built-in categories are always there. Add your own to sort spending the way you think about it.`}
        >
            <SearchablePageEmptyStateActions createLabel={t`New category`} onCreate={handleCreate} />
        </SearchablePageEmptyState>
    );
};
