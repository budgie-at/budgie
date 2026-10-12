import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagEmptyState } from '../../../tag/components/tag-empty-state/tag-empty-state';
import { useTagFormModal } from '../../../tag/context/tag-form-modal.context';
import { useDeleteTag } from '../../../tag/hooks/use-delete-tag.hook';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';

import { TagPageSelector } from './tag-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

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
        void openTagForm({ tag });
    };

    const renderCard = (tag: TagEntityInterface) => <TagCard onOpen={handleOpenTag} tag={tag} />;

    return (
        <SearchablePage
            onGoBack={handleGoBack}
            onDelete={handleDeleteTag}
            title={t`Tags`}
            searchPlaceholder={t`Search tags...`}
            data={tags}
            emptyState={<TagEmptyState search={search} />}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            searchInputTestID={TagPageSelector.SearchInput}
        />
    );
}
