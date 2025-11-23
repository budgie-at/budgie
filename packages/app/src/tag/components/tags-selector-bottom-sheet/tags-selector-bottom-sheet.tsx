import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/components/bottom-sheet-header/bottom-sheet-header';
import { Button } from '../../../@generic/components/button/button';
import { EmptyState } from '../../../@generic/components/empty-state/empty-state';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useGetTagsLiveQuery } from '../../query/use-get-tags.live-query';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly selectedTagIds: number[];
    readonly onSelect: (tagId: number) => void;
    readonly onRemoveSelection: (tagId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const snapPoints = ['70%'];

export const TagsSelectorBottomSheet = ({ ref, selectedTagIds, onSelect, onRemoveSelection }: Props) => {
    const { tags } = useGetTagsLiveQuery();
    const { t } = useLingui();

    const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

    const tagsCount = tags.length;

    return (
        <BottomSheet index={1} snapPoints={snapPoints} ref={ref}>
            <BottomSheetHeader
                className="border-b border-b-secondary-corner"
                size="md"
                title={t`Select Tags`}
                description={t`${tagsCount} tags available`}
            />

            <BottomSheetScrollView contentContainerStyle={{ rowGap: 20, paddingTop: 20, paddingHorizontal: 20, flex: 1 }}>
                {isNotEmptyArray(selectedTags) ? (
                    <View>
                        <Text className="text-secondary-foreground uppercase mb-xl text-sm font-medium">
                            <Trans>Selected {selectedTags.length}</Trans>
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

            <View className="pt-3xl border-t border-t-secondary-corner px-5xl">
                <Button
                    className="bg-primary border-primary"
                    textClassName="text-primary-reverse font-medium"
                    content={t`Done`}
                    onPress={() => ref.current?.close()}
                />
            </View>

            <SafeAreaView edges={['bottom']} />
        </BottomSheet>
    );
};
