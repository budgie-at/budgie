import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
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
    const handlePress = () => void onPress(option.value);
    const pressableProps = { disabled: isDisabled };
    const disc = isDefined(option.glyph) ? (
        <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-disc">
            <RuleGlyph glyph={option.glyph} size={20} className="text-primary" />
        </View>
    ) : (
        <CircleIcon icon={option.icon} size={36} iconSize={18} radius={18} variant="secondary" border={false} className="bg-surface-disc" />
    );

    return (
        <View className={cn(isDisabled && 'opacity-40')}>
            <SelectorRow
                testID={testID}
                isSelected={isSelected}
                onPress={handlePress}
                pressableProps={pressableProps}
                left={disc}
                title={option.label}
                subtitle={option.disabledReason ?? option.description}
            />
        </View>
    );
};
