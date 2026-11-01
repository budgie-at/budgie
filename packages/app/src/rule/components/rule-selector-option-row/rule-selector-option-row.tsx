import { Text, View } from 'react-native';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { cn } from '../../../@generic/utils/cn.util';
import { RuleGlyph } from '../rule-glyph/rule-glyph';

import type { RuleSelectorOptionInterface } from '../../interface/rule-selector-option.interface';

interface Props {
    readonly option: RuleSelectorOptionInterface;
    readonly isSelected: boolean;
    readonly onPress: (value: string) => void;
    readonly testID?: string;
}

export const RuleSelectorOptionRow = ({ option, isSelected, onPress, testID }: Props) => {
    const isDisabled = isDefined(option.disabledReason);
    const handlePress = isDisabled ? emptyFn : () => void onPress(option.value);
    const accessibilityState = { disabled: isDisabled, selected: isSelected };
    const cardClassName = cn('py-xl', isSelected && 'bg-surface-fill');
    const iconSlot = isDefined(option.glyph) ? (
        <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-ghost-background">
            <RuleGlyph glyph={option.glyph} size={24} className="text-ghost-foreground" />
        </View>
    ) : (
        <CircleIcon icon={option.icon} size={40} iconSize={20} radius={20} variant="ghost" border={false} />
    );
    const pointerEvents = isDisabled ? 'none' : 'auto';
    const subtitleText = option.disabledReason ?? option.description;
    const subtitle = isNotEmptyString(subtitleText) ? <Text className="text-sm text-secondary-foreground">{subtitleText}</Text> : null;

    return (
        <View className={cn(isDisabled && 'opacity-40')} pointerEvents={pointerEvents} accessibilityState={accessibilityState}>
            <SelectorCard
                testID={testID}
                isSelected={isSelected}
                className={cardClassName}
                onPress={handlePress}
                iconSlot={iconSlot}
                title={option.label}
                subtitle={subtitle}
            />
        </View>
    );
};
