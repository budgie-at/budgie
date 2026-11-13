import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { EntitySearchableList } from '../../../@generic/component/entity-searchable-list/entity-searchable-list';
import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { UsageFailureRow } from '../../../@generic/component/usage-failure-row/usage-failure-row';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagEmptyState } from '../../../tag/components/tag-empty-state/tag-empty-state';
import { useTagsWithUsageQuery } from '../../../tag/query/use-tags-with-usage.query';

import { TagPageSelector } from './tag-page.selector';

export default function Tags() {
    const { t } = useLingui();
    const openTagForm = useOpenModal('/tag-form');

    const [search, setSearch] = useState('');
    const { tags, usage, isUsageFailure, retryUsage, isFailure, retry } = useTagsWithUsageQuery(search);

    useCreateAction({
        icon: UserIconNameEnum.Tag,
        label: t`Tag`,
        variant: 'cyan',
        onPress: () => void openTagForm()
    });

    const handleOpenTag = (tag: TagEntityInterface) => {
        openTagForm({ tag });
    };

    const handleClearSearch = () => void setSearch('');
    const handleCreateFromSearch = (defaultTitle: string) => void openTagForm({ defaultTitle });

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
            <EntitySearchableList
                data={tags}
                isFailure={isFailure}
                onRetry={retry}
                emptyState={<TagEmptyState search={search} onClearSearch={handleClearSearch} onCreate={handleCreateFromSearch} />}
                listHeader={
                    <>
                        {isUsageFailure ? <UsageFailureRow onRetry={retryUsage} /> : null}
                        <GroupedListSectionTitle title={t`Your tags`} />
                    </>
                }
                renderCard={renderCard}
            />
        </SearchablePage>
    );
}
