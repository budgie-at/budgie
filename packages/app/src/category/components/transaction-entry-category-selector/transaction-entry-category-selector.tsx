import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { useRef } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly status?: FormFieldStatus;
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly excludeCategoryIds: number[];
    readonly onSelect: (categoryId: number) => void;
}

const cardVariants = cva<{ status: Record<FormFieldStatus, ClassValue> }>(
    'p-lg rounded-5xl border border-secondary-corner h-full w-[110px] flex-row items-center gap-x-sm',
    {
        variants: {
            status: {
                error: 'bg-destructive-background/5 border border-destructive-corner',
                default: ''
            }
        }
    }
);

export const TransactionEntryCategorySelector = ({ variant, categoryId, excludeCategoryIds, onSelect, status }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <Card onPress={handleOpen} className={cardVariants({ status })}>
                {isDefined(category) ? <Icon icon={ICONS[category.icon]} size={14} className="text-primary" /> : null}

                <Text className="text-primary text-xs flex-1" numberOfLines={1} ellipsizeMode="tail">
                    {isDefined(category) ? category.title : <Trans>Category</Trans>}
                </Text>
            </Card>

            <CategorySelectorBottomSheet
                excludeCategoryIds={excludeCategoryIds}
                variant={variant}
                selectedCategory={category}
                onSelect={onSelect}
                ref={ref}
            />
        </>
    );
};
