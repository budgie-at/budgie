import { Text, View } from 'react-native';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { cn } from '../../../@generic/utils/cn.util';

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
    const accessibilityState = { disabled: isDisabled };
    const pointerEvents = isDisabled ? 'none' : 'auto';
    const subtitleText = option.disabledReason ?? option.description;
    const subtitle = isNotEmptyString(subtitleText) ? <Text className="text-sm text-secondary-foreground">{subtitleText}</Text> : null;

    return (
        <View className={cn(isDisabled && 'opacity-40')} pointerEvents={pointerEvents} accessibilityState={accessibilityState}>
            <SelectorCard
                testID={testID}
                isSelected={isSelected}
                onPress={handlePress}
                iconSlot={<CircleIcon icon={option.icon} size={40} iconSize={20} radius={20} variant="ghost" border={false} />}
                title={option.label}
                subtitle={subtitle}
            />
        </View>
    );
};
