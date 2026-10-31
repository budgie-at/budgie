import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { useTagFormModal } from '../../context/tag-form-modal.context';
import { useSearchTagsQuery } from '../../query/use-search-tags.query';
import { tagUsageAtom } from '../../query/use-tags-with-usage.query';
import { TagMonogram } from '../tag-monogram/tag-monogram';

import type { TagEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly excludeTagIds: readonly number[];
    readonly onSelect: (tagId: number) => void;
}

export const TagDestinationSheet = (props: Props) => {
    const { title, description, excludeTagIds, onSelect } = props;
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const [search, setSearch] = useState('');
    const formatUsage = useFormatEntityUsage();
    const { tags, isFailure, retry } = useSearchTagsQuery(search);
    const usage = AsyncResult.getOrElse(useLiveAtomValue(tagUsageAtom), () => []);

    const sections = isDefined(tags) ? [{ title: t`Your tags`, data: tags.filter(tag => !excludeTagIds.includes(tag.id)) }] : null;

    const handleCreatePress = () => {
        openTagForm({ defaultTitle: search }, result => {
            if (isDefined(result)) {
                onSelect(result.tag.id);
            }
        });
    };

    const renderRow = (tag: TagEntityInterface) => (
        <DestinationRow
            key={tag.id}
            id={tag.id}
            title={tag.title}
            subtitle={formatUsage(usage.find(entry => entry.id === tag.id))}
            left={<TagMonogram title={tag.title} />}
            onSelect={onSelect}
            testID={TagsSelectorModalSelector.Card(tag.title)}
        />
    );

    return (
        <DestinationSheet
            title={title}
            description={description}
            search={search}
            onSearchChange={setSearch}
            placeholder={t`Search tags…`}
            searchTestID={TagsSelectorModalSelector.Input}
            action={
                <SelectorCreateButton label={t`Create tag`} onPress={handleCreatePress} testID={TagsSelectorModalSelector.CreateButton} />
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
                        title={t`No tags found`}
                        description={t`Try a different search term`}
                    />
                }
            />
        </DestinationSheet>
    );
};
