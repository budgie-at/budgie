import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalDescription } from '../../../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorNoResultsState } from '../../../@generic/component/selector-no-results-state/selector-no-results-state';
import { SheetHeaderAction } from '../../../@generic/component/sheet-header-action/sheet-header-action';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { TagsSelectorActionTypeEnum } from '../../enum/tags-selector-action-type.enum';
import { useSearchTagsQuery } from '../../query/use-search-tags.query';
import { reorderTagIdsByPrimary } from '../../utils/reorder-tag-ids-by-primary.util';
import { TagCreateRow } from '../tag-create-row/tag-create-row';
import { TagsSelectContent } from '../tags-select-content/tags-select-content';

import type { TagsSelectorModalParams } from '../../context/tags-selector-modal.context';
import type { TagsSelectorActionInterface } from '../../interface/tags-selector-action.interface';
import type { TagsSelectorStateInterface } from '../../interface/tags-selector-state.interface';
import type { Dispatch } from 'react';

interface Props {
    readonly params: TagsSelectorModalParams;
    readonly selection: TagsSelectorStateInterface;
    readonly search: string;
    readonly dispatch: Dispatch<TagsSelectorActionInterface>;
    readonly onSearchChange: (search: string) => void;
    readonly onCreate: () => void;
    readonly onCommit: (tagIds: number[]) => void;
}

export const TagsSelectorStep = (props: Props) => {
    const { params, selection, search, dispatch, onSearchChange, onCreate, onCommit } = props;
    const { excludeTagIds = [], title, description, singleSelect = false, enablePrimarySelection = false } = params;
    const { selected, primaryTagId } = selection;
    const { t } = useLingui();
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const { tags, isLoading } = useSearchTagsQuery(search);

    const query = search.trim();
    const count = selected.length;

    const handleSelectTag = (tagId: number) => {
        if (singleSelect) {
            commit([tagId]);
        } else {
            dispatch({ type: TagsSelectorActionTypeEnum.TAG_TOGGLED, tagId });
        }
    };

    const handlePrimarySelect = (tagId: number) => void dispatch({ type: TagsSelectorActionTypeEnum.PRIMARY_SELECTED, tagId });

    const handleDone = () => void commit(reorderTagIdsByPrimary(selected, primaryTagId));

    const listEmptyComponent = isNotEmptyString(query) ? (
        <SelectorNoResultsState query={query} hint={t`Check the spelling or create it as a new tag.`} onCreate={onCreate} />
    ) : (
        void 0
    );

    const doneAction = singleSelect ? null : (
        <SheetHeaderAction label={t`Done`} onPress={handleDone} testID={TagsSelectorModalSelector.DoneButton} />
    );

    return (
        <View style={listStyle}>
            <SheetSurface
                className="pt-lg"
                footer={
                    <Text
                        className="text-center text-[13px] text-secondary-foreground"
                        maxFontSizeMultiplier={1.6}
                    >{t`${count} selected`}</Text>
                }
            >
                <SelectorModalSearchHeader
                    search={search}
                    onSearchChange={onSearchChange}
                    title={t`Tags`}
                    placeholder={t`Search tags…`}
                    trailing={doneAction}
                    testID={TagsSelectorModalSelector.Input}
                />

                <SelectorModalDescription title={title} description={description}>
                    <TagsSelectContent
                        header={<TagCreateRow onPress={onCreate} />}
                        listEmptyComponent={listEmptyComponent}
                        data={(tags ?? []).filter(tag => !excludeTagIds.includes(tag.id))}
                        selectedTagIds={selected}
                        primaryTagId={primaryTagId}
                        isLoading={isLoading}
                        onSelect={handleSelectTag}
                        {...(enablePrimarySelection && { onPrimarySelect: handlePrimarySelect })}
                    />
                </SelectorModalDescription>
            </SheetSurface>
        </View>
    );
};
