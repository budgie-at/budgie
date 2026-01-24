import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { TagCreateForm } from '../tag/components/tag-create-form/tag-create-form';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { useTagsSelectorModal } from '../tag/context/tags-selector-modal.context';
import { useTagForm } from '../tag/hooks/use-tag-form.hook';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { useThemeContext } from '../theme/context/theme.context';

type Mode = 'select' | 'create';

const NUM_COLUMNS = 3;

const prepareTagData = (tags: TagEntityInterface[] | null, selectedTagIds: number[]) => {
    const sorted = sortSelectedFirst(isNotEmptyArray(tags) ? tags : [], selectedTagIds);

    return padFlatListData(sorted, NUM_COLUMNS);
};

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

export default function TagsSelectorModal() {
    const { t } = useLingui();
    const { currentParams, resolveTagsSelector } = useTagsSelectorModal();
    const { isDarkColorSchema } = useThemeContext();

    const [mode, setMode] = useState<Mode>('select');
    const [search, setSearch] = useState('');

    const initialTagIds = currentParams?.initialTagIds ?? [];
    const containerStyle = { flex: 1, backgroundColor: isDarkColorSchema ? BG_DARK : BG_LIGHT };

    const { tags } = useSearchTagsQuery(search);
    const { handleSubmit, reset, register } = useTagForm({ title: search });

    const data = prepareTagData(tags, initialTagIds);

    const handleSelectTag = (tagId: number) => {
        const newTagIds = initialTagIds.includes(tagId) ? initialTagIds.filter(id => id !== tagId) : [...initialTagIds, tagId];
        resolveTagsSelector(newTagIds);
    };

    const handleCreatePress = () => {
        reset({ title: search });
        setMode('create');
    };

    const handleCancelCreate = () => {
        reset();
        setMode('select');
    };

    const handleCreateSuccess = (tagId: number) => {
        setMode('select');
        setSearch('');
        resolveTagsSelector([...initialTagIds, tagId]);
    };

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

            {mode === 'select' ? (
                <TagsSelectContent data={data} selectedTagIds={initialTagIds} onSelect={handleSelectTag} />
            ) : (
                <TagCreateForm
                    register={register}
                    reset={reset}
                    handleSubmit={handleSubmit}
                    onCancel={handleCancelCreate}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </View>
    );
}
