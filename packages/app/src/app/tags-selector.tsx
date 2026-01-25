import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { TagForm, TagFormResult } from '../tag/components/tag-form/tag-form';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { useTagsSelectorModal } from '../tag/context/tags-selector-modal.context';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';

type Mode = 'select' | 'create';

const NUM_COLUMNS = 3;

const prepareTagData = (tags: TagEntityInterface[] | null, excludeTagIds: number[], selectedTagIds: number[]) => {
    const filtered = isNotEmptyArray(tags) ? tags.filter(tag => !excludeTagIds.includes(tag.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedTagIds), NUM_COLUMNS);
};

export default function TagsSelectorModal() {
    const { t } = useLingui();
    const { currentParams, resolveTagsSelector } = useTagsSelectorModal();
    const { backgroundColor } = useFormsheetListStyles();
    const [mode, setMode] = useState<Mode>('select');
    const [search, setSearch] = useState('');
    const { tags } = useSearchTagsQuery(search);

    const { initialTagIds = [], excludeTagIds = [], description, singleSelect = false } = currentParams ?? {};
    const data = prepareTagData(tags, excludeTagIds, initialTagIds);
    const containerStyle = { flex: 1, backgroundColor };

    const handleSelectTag = (tagId: number) => {
        if (singleSelect) {
            resolveTagsSelector([tagId]);

            return;
        }
        resolveTagsSelector(initialTagIds.includes(tagId) ? initialTagIds.filter(id => id !== tagId) : [...initialTagIds, tagId]);
    };

    const handleCreatePress = () => {
        setMode('create');
    };

    const handleCancelCreate = () => {
        setMode('select');
    };

    const handleCreateSuccess = (result: TagFormResult) => {
        setMode('select');
        setSearch('');
        resolveTagsSelector([...initialTagIds, result.tag.id]);
    };

    /* jscpd:ignore-start - FormSheet selector modal pattern */
    return (
        <View style={containerStyle}>
            {mode === 'select' ? (
                <SelectorModalSearchHeader
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search tags...`}
                    rightActionIcon={UserIconNameEnum.Plus}
                    rightActionOnPress={handleCreatePress}
                />
            ) : null}

            {mode === 'select' && isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            {mode === 'select' ? (
                <TagsSelectContent data={data} selectedTagIds={initialTagIds} onSelect={handleSelectTag} />
            ) : (
                <TagForm defaultTitle={search} onCancel={handleCancelCreate} onSuccess={handleCreateSuccess} />
            )}
        </View>
    );
    /* jscpd:ignore-end */
}
