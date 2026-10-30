import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxGroupChoiceSelection } from '../../hook/use-categorize-inbox-group-choice-selection.hook';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import type { CategorizeInboxGroupChoiceType } from '../../interface/categorize-inbox-group-choice.type';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly choice: CategorizeInboxGroupChoiceType;
    readonly variant: 'positive' | 'neutral';
    readonly title: string;
    readonly subtitle: string;
    readonly icon: UserIconType;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const discVariants = cva('', {
    variants: { variant: { positive: 'bg-positive-action/15', neutral: 'bg-secondary-foreground/15' } }
});

const iconVariants = cva('', {
    variants: { variant: { positive: 'text-positive-action', neutral: 'text-secondary-foreground' } }
});

export const CategorizeInboxLeadOption = ({ choice, variant, title, subtitle, icon }: Props) => {
    const { isSelected, accessibilityState, onSelect } = useCategorizeInboxGroupChoiceSelection(choice);

    return (
        <View className="overflow-hidden rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS}>
            <HapticPressable
                onPress={onSelect}
                className="min-h-[72px] flex-row items-center gap-x-md px-3xl py-xl active:opacity-70"
                accessibilityRole="button"
                accessibilityState={accessibilityState}
                {...testID(CategorizeInboxGroupScreenSelector.Option, title)}
            >
                <CircleIcon
                    icon={icon}
                    variant="secondary"
                    size={40}
                    iconSize={20}
                    radius={20}
                    border={false}
                    className={discVariants({ variant })}
                    iconClassName={iconVariants({ variant })}
                />
                <View className="min-w-0 flex-1 gap-y-xxs">
                    <Text className="text-primary text-[17px] font-semibold" numberOfLines={2}>
                        {title}
                    </Text>
                    <Text className="text-secondary-foreground text-[13px]" numberOfLines={2}>
                        {subtitle}
                    </Text>
                </View>
                <CategorizeInboxSelectionIndicator isSelected={isSelected} />
            </HapticPressable>
        </View>
    );
};
