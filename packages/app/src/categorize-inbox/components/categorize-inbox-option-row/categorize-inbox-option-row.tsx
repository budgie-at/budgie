import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';

import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';
import type { AccessibilityState } from 'react-native';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle?: string;
    readonly accessory?: ReactNode;
    readonly accessibilityState?: AccessibilityState;
    readonly tone?: CategorizeInboxTonalCapsuleVariantEnum;
    readonly onPress: () => void;
}

const DISC_CLASS_NAME: Record<CategorizeInboxTonalCapsuleVariantEnum, string> = {
    [CategorizeInboxTonalCapsuleVariantEnum.POSITIVE]: 'bg-positive-tonal',
    [CategorizeInboxTonalCapsuleVariantEnum.CASH]: 'bg-cash-tonal',
    [CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL]: 'bg-surface-disc'
};

const GLYPH_CLASS_NAME: Record<CategorizeInboxTonalCapsuleVariantEnum, string> = {
    [CategorizeInboxTonalCapsuleVariantEnum.POSITIVE]: 'text-positive-action',
    [CategorizeInboxTonalCapsuleVariantEnum.CASH]: 'text-cash-action',
    [CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL]: 'text-secondary-foreground'
};

export const CategorizeInboxOptionRow = ({
    icon,
    title,
    subtitle,
    accessory,
    accessibilityState,
    tone = CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL,
    onPress
}: Props) => {
    const titleWeightClassName = accessibilityState?.selected === true ? 'font-semibold' : 'font-normal';
    const subtitleNode = isNotEmptyString(subtitle) ? (
        <Text className="text-secondary-foreground text-[13px]" numberOfLines={1}>
            {subtitle}
        </Text>
    ) : null;

    return (
        <HapticPressable
            onPress={onPress}
            className="min-h-[60px] flex-row items-center gap-x-xl px-3xl py-xl active:opacity-70"
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
        >
            <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
            <CircleIcon
                icon={icon}
                variant="secondary"
                size={36}
                iconSize={18}
                radius={18}
                border={false}
                className={DISC_CLASS_NAME[tone]}
                iconClassName={GLYPH_CLASS_NAME[tone]}
            />
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className={cn('text-primary text-[17px]', titleWeightClassName)} numberOfLines={2}>
                    {title}
                </Text>
                {subtitleNode}
            </View>
            {accessory}
        </HapticPressable>
    );
};
