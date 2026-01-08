import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetTagByIdsQuery } from '../../query/use-get-tag-by-ids.query';
import { TagsSelectorBottomSheet } from '../tags-selector-bottom-sheet/tags-selector-bottom-sheet';

interface Props {
    readonly tagIds: number[];
    readonly variant: ColorPaletteVariant;
    readonly onChange: (tagIds: number[]) => void;
}

const iconVariants = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const TagsSelector = ({ variant, tagIds, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const { tags: selectedTags } = useGetTagByIdsQuery(tagIds);

    const handleOpen = () => void ref.current?.open();

    const handleToggleTag = (id: number) => {
        const isSelected = tagIds.includes(id);
        onChange(isSelected ? tagIds.filter(tagId => tagId !== id) : [...tagIds, id]);
    };

    return (
        <>
            <HorizontalCell
                onPress={handleOpen}
                left={<Icon size={16} icon={UserIconNameEnum.Tag} className={iconVariants({ variant })} />}
                size="lg"
            >
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
            </HorizontalCell>

            <TagsSelectorBottomSheet onSelect={handleToggleTag} selectedTagIds={tagIds} ref={ref} />
        </>
    );
};
