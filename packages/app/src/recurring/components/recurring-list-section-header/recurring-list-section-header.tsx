import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { RecurringSectionEnum } from '../../enum/recurring-section.enum';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';

interface Props {
    readonly section: RecurringSectionEnum;
    readonly count: number;
    readonly isCollapsed: boolean;
    readonly onToggle: (section: RecurringSectionEnum) => void;
}

export const RecurringListSectionHeader = ({ section, count, isCollapsed, onToggle }: Props) => {
    const { t } = useLingui();
    const titles: Record<RecurringSectionEnum, string> = {
        [RecurringSectionEnum.EXPENSES]: t`Expenses`,
        [RecurringSectionEnum.INCOME]: t`Income`,
        [RecurringSectionEnum.POSSIBLE]: t`Possible`,
        [RecurringSectionEnum.ENDED]: t`Ended`
    };
    const isCollapsible = section === RecurringSectionEnum.POSSIBLE || section === RecurringSectionEnum.ENDED;
    const chevron = isCollapsed ? UserIconNameEnum.ChevronRight : UserIconNameEnum.ChevronDown;
    const accessibilityState = { expanded: !isCollapsed };

    const handlePress = () => void onToggle(section);

    const content = (
        <View className="min-h-[36px] flex-row items-center gap-x-md bg-surface px-3xl py-xs">
            <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[13px] font-semibold text-primary"
            >
                {titles[section]}
            </Text>
            <Text
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                className="flex-1 text-[13px] text-secondary-foreground tabular-nums"
            >
                {count}
            </Text>
            {isCollapsible ? <Icon icon={chevron} size={16} className="text-secondary-foreground" /> : null}
        </View>
    );

    if (!isCollapsible) {
        return content;
    }

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className="active:scale-100 active:opacity-70"
            onPress={handlePress}
            testID={RecurringPaneSelector.SectionHeader(section)}
        >
            {content}
        </HapticPressable>
    );
};
