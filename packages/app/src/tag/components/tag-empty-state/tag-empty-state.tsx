import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyStateActions } from '../../../@generic/component/searchable-page-empty-state-actions/searchable-page-empty-state-actions';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';

import type { SearchableEntityEmptyStatePropsInterface } from '../../../@generic/interface/searchable-entity-empty-state-props.interface';

export const TagEmptyState = ({ search, onClearSearch, onCreate }: SearchableEntityEmptyStatePropsInterface) => {
    const { t } = useLingui();
    const trimmedSearch = search.trim();
    const hasSearch = isNotEmptyString(trimmedSearch);
    const icon = hasSearch ? UserIconNameEnum.Search : UserIconNameEnum.Tag;
    const title = hasSearch ? t`No tags match “${trimmedSearch}”` : t`No tags yet`;
    const description = hasSearch
        ? t`Check the spelling or create it as a new tag.`
        : t`Tags cut across categories — track a trip, a project or a person and see the true total.`;

    const handleCreate = () => void onCreate(trimmedSearch);

    return (
        <SearchablePageEmptyState icon={icon} title={title} description={description}>
            <SearchablePageEmptyStateActions
                search={trimmedSearch}
                createLabel={t`New tag`}
                onCreate={handleCreate}
                onClearSearch={onClearSearch}
            />
        </SearchablePageEmptyState>
    );
};
