import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
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
    const isLargeText = useIsLargeTextSize();
    const isDisabled = isDefined(option.disabledReason);
    const handlePress = () => void onPress(option.value);
    const pressableProps = { disabled: isDisabled, accessibilityState: { selected: isSelected, disabled: isDisabled } };
    const titleClassName = isSelected ? 'text-primary text-[17px] font-semibold' : 'text-primary text-[17px]';
    const disabledTitleClassName = isDisabled ? 'text-secondary-foreground' : '';
    const disabledClassName = isDisabled ? 'opacity-40' : '';
    const title = (
        <Text className={cn(titleClassName, disabledTitleClassName)} maxFontSizeMultiplier={2}>
            {option.label}
        </Text>
    );
    const subtitle = (
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" maxFontSizeMultiplier={2}>
            {option.disabledReason ?? option.description}
        </Text>
    );
    const disc = isDefined(option.glyph) ? (
        <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-disc">
            <RuleGlyph glyph={option.glyph} size={20} className="text-primary" />
        </View>
    ) : (
        <CircleIcon icon={option.icon} size={36} iconSize={18} radius={18} variant="secondary" border={false} className="bg-surface-disc" />
    );
    const leading = isLargeText ? null : <View className={cn('h-[42px] justify-center', disabledClassName)}>{disc}</View>;
    const check = isSelected ? (
        <Icon icon={UserIconNameEnum.Check} size={22} className="text-positive-action" />
    ) : (
        <View className="w-[22px]" />
    );

    return (
        <GroupedListRow
            testID={testID}
            onPress={handlePress}
            pressableProps={pressableProps}
            left={leading}
            right={check}
            title={title}
            subtitle={subtitle}
        />
    );
};
