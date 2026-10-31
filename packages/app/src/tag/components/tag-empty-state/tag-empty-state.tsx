import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyStateActions } from '../../../@generic/component/searchable-page-empty-state-actions/searchable-page-empty-state-actions';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { useTagFormModal } from '../../context/tag-form-modal.context';

interface Props {
    readonly search: string;
    readonly onClearSearch: EmptyFn;
}

export const TagEmptyState = ({ search, onClearSearch }: Props) => {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const trimmedSearch = search.trim();

    const handleCreate = () => void openTagForm({ defaultTitle: trimmedSearch });

    if (isNotEmptyString(trimmedSearch)) {
        return (
            <SearchablePageEmptyState
                icon={UserIconNameEnum.Search}
                title={t`No tags match “${trimmedSearch}”`}
                description={t`Check the spelling or create it as a new tag.`}
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
            icon={UserIconNameEnum.Tag}
            title={t`No tags yet`}
            description={t`Tags cut across categories — track a trip, a project or a person and see the true total.`}
        >
            <SearchablePageEmptyStateActions createLabel={t`New tag`} onCreate={handleCreate} />
        </SearchablePageEmptyState>
    );
};
