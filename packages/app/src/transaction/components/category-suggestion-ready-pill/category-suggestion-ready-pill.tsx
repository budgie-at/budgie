import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly variant: ColorPaletteVariant;
    readonly onPress: () => void;
}

export const CategorySuggestionReadyPill = ({ category, variant, onPress }: Props) => {
    const categoryTitle = category.title;
    const accessibilityLabel = t`Apply suggested category: ${categoryTitle}`;

    return (
        <HapticPressable
            className="flex-row items-center gap-sm px-md py-xs bg-surface-secondary rounded-full border border-outline-secondary"
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
        >
            <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-warning" />
            <CircleIcon icon={category.icon} variant={variant} size={20} iconSize={12} radius={6} border={false} />
            <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                {category.title}
            </Text>
        </HapticPressable>
    );
};
