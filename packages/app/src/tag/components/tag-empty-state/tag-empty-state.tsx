import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyStateActions } from '../../../@generic/component/searchable-page-empty-state-actions/searchable-page-empty-state-actions';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { useTagFormModal } from '../../context/tag-form-modal.context';

interface Props {
    readonly search: string;
    readonly onClearSearch: EmptyFn;
    readonly onCreate?: (defaultTitle: string) => void;
}

export const TagEmptyState = ({ search, onClearSearch, onCreate }: Props) => {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const trimmedSearch = search.trim();
    const hasSearch = isNotEmptyString(trimmedSearch);
    const icon = hasSearch ? UserIconNameEnum.Search : UserIconNameEnum.Tag;
    const title = hasSearch ? t`No tags match “${trimmedSearch}”` : t`No tags yet`;
    const description = hasSearch
        ? t`Check the spelling or create it as a new tag.`
        : t`Tags cut across categories — track a trip, a project or a person and see the true total.`;

    const handleCreate = () => void (isDefined(onCreate) ? onCreate(trimmedSearch) : openTagForm({ defaultTitle: trimmedSearch }));

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
