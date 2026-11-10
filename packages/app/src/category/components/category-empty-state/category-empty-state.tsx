import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyStateActions } from '../../../@generic/component/searchable-page-empty-state-actions/searchable-page-empty-state-actions';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';

import type { SearchableEntityEmptyStatePropsInterface } from '../../../@generic/interface/searchable-entity-empty-state-props.interface';

export const CategoryEmptyState = ({ search, onClearSearch, onCreate }: SearchableEntityEmptyStatePropsInterface) => {
    const { t } = useLingui();
    const trimmedSearch = search.trim();
    const hasSearch = isNotEmptyString(trimmedSearch);
    const icon = hasSearch ? UserIconNameEnum.Search : UserIconNameEnum.Folder;
    const title = hasSearch ? t`No categories match “${trimmedSearch}”` : t`No custom categories yet`;
    const description = hasSearch
        ? t`Check the spelling or create it as a new category.`
        : t`Built-in categories are always there. Add your own to sort spending the way you think about it.`;

    const handleCreate = () => void onCreate(trimmedSearch);

    return (
        <SearchablePageEmptyState icon={icon} title={title} description={description}>
            <SearchablePageEmptyStateActions
                search={trimmedSearch}
                createLabel={t`New category`}
                onCreate={handleCreate}
                onClearSearch={onClearSearch}
            />
        </SearchablePageEmptyState>
    );
};
