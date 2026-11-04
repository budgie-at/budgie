import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';

interface Props {
    readonly categoryId: number;
    readonly onUndo: () => void;
}

const UNDO_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 } as const;

export const BudgetEventRemovedLimitNote = ({ categoryId, onUndo }: Props) => {
    const { t } = useLingui();
    const { category } = useGetCategoryByIdQuery(categoryId);
    const categoryTitle = isDefined(category) ? category.title : t`Category`;

    useEffect(() => {
        AccessibilityInfo.announceForAccessibility(t`${categoryTitle} limit removed. Undo available.`);
    }, [categoryTitle, t]);

    return (
        <View className="flex-row items-center justify-between gap-x-md pt-sm pl-3xl">
            <Text className="text-secondary-foreground shrink text-[13px] leading-[18px]">
                <Trans>{categoryTitle} limit removed.</Trans>
            </Text>
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={t`Undo removing the ${categoryTitle} limit`}
                hitSlop={UNDO_HIT_SLOP}
                className="active:opacity-70"
                onPress={onUndo}
            >
                <Text className="text-default-foreground text-[13px] font-semibold leading-[18px]">
                    <Trans>Undo</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
