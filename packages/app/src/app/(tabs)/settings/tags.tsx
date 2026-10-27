import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagEmptyState } from '../../../tag/components/tag-empty-state/tag-empty-state';
import { useTagFormModal } from '../../../tag/context/tag-form-modal.context';
import { useDeleteTag } from '../../../tag/hooks/use-delete-tag.hook';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';

import { TagPageSelector } from './tag-page.selector';

export default function Tags() {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();

    const [search, setSearch] = useState('');
    const handleDeleteTag = useDeleteTag();
    const { tags } = useSearchTagsQuery(search);

    useCreateAction({
        icon: UserIconNameEnum.Tag,
        label: t`Tag`,
        variant: 'primary',
        onPress: () => void openTagForm()
    });

    const handleOpenTag = (tag: TagEntityInterface) => {
        openTagForm({ tag });
    };

    const renderCard = (tag: TagEntityInterface) => <TagCard onOpen={handleOpenTag} tag={tag} />;

    return (
        <SearchablePage
            title={t`Tags`}
            onGoBack={goBackToSettings}
            search={search}
            searchPlaceholder={t`Search tags...`}
            onSearchChange={setSearch}
            searchInputTestID={TagPageSelector.SearchInput}
        >
            <SearchablePageList
                data={tags}
                emptyState={<TagEmptyState search={search} />}
                onDelete={handleDeleteTag}
                renderCard={renderCard}
            />
        </SearchablePage>
    );
}
