import { Trans } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetTagByIdsQuery } from '../../query/use-get-tag-by-ids.query';
import { TagsSelectorBottomSheet } from '../tags-selector-bottom-sheet/tags-selector-bottom-sheet';
import { cva } from 'class-variance-authority';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';

interface Props {
    readonly variant: ColorPaletteVariant;
}

const iconVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const TagsSelector = ({ variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [tagIds, setTagIds] = useState<number[]>([]);

    const { tags: selectedTags } = useGetTagByIdsQuery(tagIds);
    const selectedTagIds = selectedTags?.map(tag => tag.id) ?? [];

    const handleOpen = () => void ref.current?.open();

    const handleSelect = (id: number) => {
        setTagIds(prev => Array.from(new Set([...prev, id])));
    };

    const handleRemoveSelection = (id: number) => {
        setTagIds(prev => prev.filter(tagId => tagId !== id));
    };

    return (
        <>
            <Card onPress={handleOpen} className="flex-row items-center gap-x-xl">
                <Icon size={16} icon={ICONS.Tag} className={iconVariants({ variant })} />

                {isNotEmptyArray(selectedTags) ? (
                    <View className="mr-auto flex-row items-baseline">
                        <Text className="text-sm text-primary font-semibold">{selectedTags[0].title}</Text>

                        {selectedTags.length > 1 ? (
                            <Text className="text-secondary-foreground">&nbsp;+{selectedTags.length - 1}</Text>
                        ) : null}
                    </View>
                ) : (
                    <Text className="flex-1 text-center font-semibold text-secondary-foreground text-sm">
                        <Trans>None</Trans>
                    </Text>
                )}

                <View className="w-8.5" />
            </Card>

            <TagsSelectorBottomSheet
                onRemoveSelection={handleRemoveSelection}
                selectedTagIds={selectedTagIds}
                onSelect={handleSelect}
                ref={ref}
            />
        </>
    );
};
