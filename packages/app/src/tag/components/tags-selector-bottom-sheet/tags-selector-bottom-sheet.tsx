import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Text, View } from 'react-native';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/components/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/components/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { Button } from '../../../@generic/components/button/button';
import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchTagsLiveQuery } from '../../query/use-search-tags-live.query';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly selectedTagIds: number[];
    readonly onSelect: (tagId: number) => void;
    readonly onRemoveSelection: (tagId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const snapPoints = ['70%'];
const safeEdges: Edges = ['bottom']

export const TagsSelectorBottomSheet = ({ ref, selectedTagIds, onSelect, onRemoveSelection }: Props) => {
    const { tags } = useSearchTagsLiveQuery();
    const { t } = useLingui();

    const selectedTags = tags?.filter(tag => selectedTagIds.includes(tag.id)) ?? [];
    const tagsCount = tags?.length ?? 0;
    const selectedTagsCount = selectedTags.length;
    const description = t`${tagsCount} tags available`;

    const handleClose = () => ref.current?.close()
    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`

    return (
        <BottomSheet snapPoints={snapPoints} ref={ref}>
            <BottomSheetHeader className="border-b border-b-secondary-corner" size="md" title={t`Select Tags`} description={description} />

            <BottomSheetScrollView contentContainerClassName="flex-1 pt-5xl px-5xl gap-y-5xl">
                {isNotEmptyArray(selectedTags) ? (
                    <View>
                        <Text className="text-secondary-foreground uppercase mb-xl text-sm font-medium">
                            <Trans>Selected {selectedTagsCount}</Trans>
                        </Text>

                        <View className="flex-row flex-wrap gap-xl">
                            {selectedTags.map(({ id, title }) => (
                                <TagsSelectorCard
                                    variant="removable"
                                    key={id}
                                    title={title}
                                    id={id}
                                    onSelect={onRemoveSelection}
                                    isSelected
                                />
                            ))}
                        </View>
                    </View>
                ) : null}

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
                            circleIcon="Tag"
                            title={t`No tags yet`}
                            titleClassName="text-primary font-semibold"
                            descriptionClassName="max-w-[250px] text-center mx-auto"
                            description={t`Create your first tag above to organize your transactions`}
                        />
                    )}
                </View>
            </BottomSheetScrollView>

            <SafeAreaView edges={safeEdges}>
                <View className="pt-3xl border-t border-t-secondary-corner px-5xl">
                    <Button size="md" variant="ghost" content={buttonText} onPress={handleClose} />
                </View>
            </SafeAreaView>
        </BottomSheet>
    );
};
