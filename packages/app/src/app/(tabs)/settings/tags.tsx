import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { SearchablePageErrorState } from '../../../@generic/component/searchable-page-error-state/searchable-page-error-state';
import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagEmptyState } from '../../../tag/components/tag-empty-state/tag-empty-state';
import { useTagFormModal } from '../../../tag/context/tag-form-modal.context';
import { useTagsWithUsageQuery } from '../../../tag/query/use-tags-with-usage.query';

import { TagPageSelector } from './tag-page.selector';

const NO_TAGS: TagEntityInterface[] = [];

export default function Tags() {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();

    const [search, setSearch] = useState('');
    const { tags, usage, isFailure, retry } = useTagsWithUsageQuery(search);

    useCreateAction({
        icon: UserIconNameEnum.Tag,
        label: t`Tag`,
        variant: 'primary',
        onPress: () => void openTagForm()
    });

    const handleOpenTag = (tag: TagEntityInterface) => {
        openTagForm({ tag });
    };

    const handleClearSearch = () => void setSearch('');

    const listData = isFailure ? NO_TAGS : tags;
    const emptyState = isFailure ? (
        <SearchablePageErrorState onRetry={retry} />
    ) : (
        <TagEmptyState search={search} onClearSearch={handleClearSearch} />
    );

    const renderCard = (tag: TagEntityInterface, index: number, isLast: boolean) => (
        <TagCard
            key={tag.id}
            onOpen={handleOpenTag}
            tag={tag}
            usage={usage?.find(entry => entry.id === tag.id)}
            isFirst={index === 0}
            isLast={isLast}
        />
    );

    return (
        <SearchablePage
            title={t`Tags`}
            onGoBack={goBackToSettings}
            search={search}
            searchPlaceholder={t`Search tags…`}
            onSearchChange={setSearch}
            searchInputTestID={TagPageSelector.SearchInput}
        >
            <SearchablePageList
                data={listData}
                emptyState={emptyState}
                listHeader={<GroupedListSectionTitle title={t`Your tags`} />}
                renderCard={renderCard}
                gap={0}
            />
        </SearchablePage>
    );
}
