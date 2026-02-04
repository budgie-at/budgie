/* jscpd:ignore-start - Selector modal imports pattern */
import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
/* jscpd:ignore-end */
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { useTagFormModal } from '../tag/context/tag-form-modal.context';
import { useTagsSelectorModal } from '../tag/context/tags-selector-modal.context';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';

const NUM_COLUMNS = 3;

const prepareTagData = (tags: TagEntityInterface[] | null, excludeTagIds: number[], selectedTagIds: number[]) => {
    const filtered = isNotEmptyArray(tags) ? tags.filter(tag => !excludeTagIds.includes(tag.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedTagIds), NUM_COLUMNS);
};

export default function TagsSelectorModal() {
    const { t } = useLingui();
    const { openTagForm } = useTagFormModal();
    const { currentParams, resolveTagsSelector } = useTagsSelectorModal();
    const { backgroundColor } = useFormsheetListStyles();
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

    const handleCreatePress = async () => {
        const result = await openTagForm({ defaultTitle: search });
        if (isDefined(result)) {
            resolveTagsSelector([...initialTagIds, result.tag.id]);
        }
    };

    /* jscpd:ignore-start - FormSheet selector modal pattern */
    return (
        <View style={containerStyle} collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search tags...`}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreatePress}
            />

            {isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            <TagsSelectContent data={data} selectedTagIds={initialTagIds} onSelect={handleSelectTag} />
        </View>
    );
    /* jscpd:ignore-end */
}
