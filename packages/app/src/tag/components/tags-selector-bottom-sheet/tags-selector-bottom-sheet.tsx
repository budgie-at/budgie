import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { BottomSheetSearch } from '../../../@generic/component/bottom-sheet-search/bottom-sheet-search';
import { Button } from '../../../@generic/component/button/button';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Footer } from '../../../@generic/component/footer/footer';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchTagsQuery } from '../../query/use-search-tags.query';
import { TagFormBottomSheet } from '../tag-form-bottom-sheet/tag-form-bottom-sheet';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly selectedTagIds: number[];
    readonly onSelect: (tagId: number) => void;
    readonly onRemoveSelection: (tagId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const snapPoints = ['70%'];

const renderSelectedTags = (selectedTags: TagEntityInterface[], selectedTagsCount: number, onRemoveSelection: (tagId: number) => void) => (
    <View>
        <Text className="text-secondary-foreground uppercase mb-xl text-sm font-medium">
            <Trans>Selected {selectedTagsCount}</Trans>
        </Text>

        <View className="flex-row flex-wrap gap-xl">
            {selectedTags.map(({ id, title }) => (
                <TagsSelectorCard variant="removable" key={id} title={title} id={id} onSelect={onRemoveSelection} isSelected />
            ))}
        </View>
    </View>
);

export const TagsSelectorBottomSheet = ({ ref, selectedTagIds, onSelect, onRemoveSelection }: Props) => {
    const [search, setSearch] = useState('');
    const { tags } = useSearchTagsQuery(search);
    const { t } = useLingui();
    const tagFormRef = useRef<BottomSheetInterface | null>(null);

    const selectedTags = tags?.filter(tag => selectedTagIds.includes(tag.id)) ?? [];
    const selectedTagsCount = selectedTags.length;
    const tagsCount = tags?.length ?? 0;

    const handleCreateTag = () => void tagFormRef.current?.open();

    const handleTagCreated = (tag: TagEntityInterface) => {
        setSearch('');
        onSelect(tag.id);
    };

    const handleClose = () => void ref.current?.close();

    const rightAction = { icon: UserIconNameEnum.Plus, onPress: handleCreateTag };
    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`;

    return (
        <>
            <BottomSheet snapPoints={snapPoints} ref={ref}>
                <BottomSheetHeader
                    className="border-b border-b-secondary-corner"
                    size="md"
                    title={t`Select Tags`}
                    description={t`${tagsCount} tags available`}
                />

                <BottomSheetSearch onChangeText={setSearch} placeholder={t`Search tags...`} value={search} rightAction={rightAction} />

                <BottomSheetScrollView contentContainerClassName="flex-1 pt-5xl px-5xl gap-y-5xl">
                    {isNotEmptyArray(selectedTags) ? renderSelectedTags(selectedTags, selectedTagsCount, onRemoveSelection) : null}

                    <View className="flex-1">
                        <Text className="text-secondary-foreground uppercase mb-xl text-sm font-medium">
                            <Trans>Common Tags</Trans>
                        </Text>

                        {isNotEmptyArray(tags) ? (
                            <View className="flex-row flex-wrap gap-xl">
                                {tags.map(({ id, title }) => (
                                    <TagsSelectorCard
                                        isSelected={selectedTagIds.includes(id)}
                                        onSelect={onSelect}
                                        variant="static"
                                        title={title}
                                        key={id}
                                        id={id}
                                    />
                                ))}
                            </View>
                        ) : (
                            <EmptyState
                                circleIcon={UserIconNameEnum.Tag}
                                title={t`No tags found`}
                                titleClassName="text-primary font-semibold"
                                descriptionClassName="max-w-[250px] text-center mx-auto"
                                description={t`Try a different search term or create a new tag`}
                            />
                        )}
                    </View>
                </BottomSheetScrollView>

                <Footer>
                    <Button size="md" variant="ghost" content={buttonText} onPress={handleClose} />
                </Footer>
            </BottomSheet>

            <TagFormBottomSheet ref={tagFormRef} tag={null} defaultTitle={search} onTagCreated={handleTagCreated} />
        </>
    );
};
