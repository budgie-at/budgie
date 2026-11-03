import { useLingui } from '@lingui/react/macro';
import * as React from 'react';

import { isDefined } from '@rnw-community/shared';

import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationSheetFooter } from '../../../@generic/component/destination-sheet-footer/destination-sheet-footer';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { useDestinationSelection } from '../../../@generic/hook/use-destination-selection.hook';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { useTagFormModal } from '../../context/tag-form-modal.context';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../../context/tags-selector-modal.context';
import { useTagsWithUsageQuery } from '../../query/use-tags-with-usage.query';
import { TagDestinationRow } from '../tag-destination-row/tag-destination-row';
import { TagEmptyState } from '../tag-empty-state/tag-empty-state';

import type { TagEntityInterface } from '@budgie/contracts';

export const TagDestinationSheet = () => {
    const tagParams = useTagsSelectorModalParams();
    const [, resolveTagsSelector] = useTagsSelectorModal();
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const [search, setSearch] = React.useState('');
    const { tags, usage, isUsageFailure, retryUsage, isFailure, retry } = useTagsWithUsageQuery(search);

    const destinations = tags?.filter(tag => !tagParams?.excludeTagIds?.includes(tag.id));
    const { selected, setSelected, isPending, handleRowSelect, handleCommit } = useDestinationSelection(
        destinations,
        tagId => void resolveTagsSelector([tagId])
    );
    const sections = isDefined(destinations) ? [{ title: t`Your tags`, data: destinations }] : null;
    const commitCopy = isDefined(selected) ? (tagParams?.getCommitCopy?.(selected.title) ?? null) : null;

    const handleCreatePress = (defaultTitle: string) => {
        openTagForm({ defaultTitle }, result => {
            if (isDefined(result)) {
                setSelected(result.tag);
            }
        });
    };

    const handleCreateFromSearch = () => void handleCreatePress(search.trim());

    const handleClearSearch = () => void setSearch('');

    const renderRow = (tag: TagEntityInterface) => (
        <TagDestinationRow
            tag={tag}
            usage={usage?.find(entry => entry.id === tag.id)}
            isSelected={selected?.id === tag.id}
            isDisabled={isPending}
            onSelect={handleRowSelect}
        />
    );

    return (
        <DestinationSheet
            title={tagParams?.title ?? ''}
            description={tagParams?.description}
            search={search}
            onSearchChange={setSearch}
            placeholder={t`Search tags…`}
            searchTestID={TagsSelectorModalSelector.Input}
            action={
                <SelectorCreateButton
                    label={t`Create tag`}
                    onPress={handleCreateFromSearch}
                    testID={TagsSelectorModalSelector.CreateButton}
                />
            }
        >
            <DestinationList
                sections={sections}
                isFailure={isFailure}
                onRetry={retry}
                isUsageFailure={isUsageFailure}
                onRetryUsage={retryUsage}
                renderRow={renderRow}
                emptyState={<TagEmptyState search={search} onClearSearch={handleClearSearch} onCreate={handleCreatePress} />}
            />
            <DestinationSheetFooter
                commitCopy={commitCopy}
                commitLabel={tagParams?.commitLabel ?? ''}
                pickLabel={t`Pick a tag to continue`}
                onCommit={handleCommit}
                testID={TagsSelectorModalSelector.CommitButton}
            />
        </DestinationSheet>
    );
};
