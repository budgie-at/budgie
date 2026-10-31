import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DestinationList } from '../../../@generic/component/destination-list/destination-list';
import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { DestinationSheetFooter } from '../../../@generic/component/destination-sheet-footer/destination-sheet-footer';
import { DestinationSheet } from '../../../@generic/component/destination-sheet/destination-sheet';
import { SelectorCreateButton } from '../../../@generic/component/selector-create-button/selector-create-button';
import { useDestinationSelection } from '../../../@generic/hook/use-destination-selection.hook';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { useTagFormModal } from '../../context/tag-form-modal.context';
import { useTagsWithUsageQuery } from '../../query/use-tags-with-usage.query';
import { TagEmptyState } from '../tag-empty-state/tag-empty-state';
import { TagMonogram } from '../tag-monogram/tag-monogram';

import type { TagEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly excludeTagIds: readonly number[];
    readonly getCommitLabel: (destinationTitle: string) => string;
    readonly onSelect: (tagId: number) => void;
}

export const TagDestinationSheet = (props: Props) => {
    const { title, description, excludeTagIds, getCommitLabel, onSelect } = props;
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const [search, setSearch] = useState('');
    const formatUsage = useFormatEntityUsage();
    const { tags, usage, isUsageFailure, retryUsage, isFailure, retry } = useTagsWithUsageQuery(search);

    const destinations = tags?.filter(tag => !excludeTagIds.includes(tag.id));
    const { selected, setSelected, isPending, handleRowSelect, handleCommit } = useDestinationSelection(destinations, onSelect);
    const sections = isDefined(destinations) ? [{ title: t`Your tags`, data: destinations }] : null;
    const commitLabel = isDefined(selected) ? getCommitLabel(selected.title) : t`Pick a tag to continue`;

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
        <DestinationRow
            id={tag.id}
            title={tag.title}
            subtitle={formatUsage(usage?.find(entry => entry.id === tag.id))}
            left={<TagMonogram title={tag.title} />}
            isSelected={selected?.id === tag.id}
            isDisabled={isPending}
            onSelect={handleRowSelect}
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
                label={commitLabel}
                isDisabled={!isDefined(selected)}
                onPress={handleCommit}
                testID={TagsSelectorModalSelector.CommitButton}
            />
        </DestinationSheet>
    );
};
