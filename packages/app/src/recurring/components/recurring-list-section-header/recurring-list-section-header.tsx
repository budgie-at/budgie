import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

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

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringListSectionHeader = ({ section, count, isCollapsed, onToggle }: Props) => {
    const { t } = useLingui();
    const titles: Record<RecurringSectionEnum, string> = {
        [RecurringSectionEnum.DUE_SOON]: t`Next 7 days`,
        [RecurringSectionEnum.THIS_MONTH]: t`Later this month`,
        [RecurringSectionEnum.LATER]: t`Coming up`,
        [RecurringSectionEnum.INCOME]: t`Income`,
        [RecurringSectionEnum.POSSIBLE]: t`Possible`,
        [RecurringSectionEnum.ENDED]: t`Ended`
    };
    const captions: Partial<Record<RecurringSectionEnum, string>> = {
        [RecurringSectionEnum.POSSIBLE]: t`Not counted in totals yet`,
        [RecurringSectionEnum.ENDED]: t`No upcoming payments`
    };
    const caption = captions[section];
    const chevron = isCollapsed ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronUp;
    const accessibilityState = { expanded: !isCollapsed };

    const handlePress = () => void onToggle(section);

    if (!isDefined(caption)) {
        return (
            <View className="min-h-[40px] flex-row items-end gap-x-sm bg-surface px-3xl pt-xl pb-sm">
                <Text
                    accessibilityRole="header"
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-[15px] font-semibold text-primary"
                >
                    {titles[section]}
                </Text>
                <Text maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER} className="text-[15px] text-secondary-foreground tabular-nums">
                    {count}
                </Text>
            </View>
        );
    }

    return (
        <View className="bg-surface px-3xl pt-xl pb-sm">
            <HapticPressable
                accessibilityRole="button"
                accessibilityState={accessibilityState}
                accessibilityHint={caption}
                className="min-h-[56px] flex-row items-center gap-x-xl rounded-3xl bg-grouped-surface-row px-3xl py-md active:scale-100 active:opacity-70"
                style={continuousCorners}
                onPress={handlePress}
                testID={RecurringPaneSelector.SectionHeader(section)}
            >
                <View className="min-w-0 flex-1 gap-y-xxs">
                    <Text maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER} className="text-[16px] font-semibold text-primary">
                        {titles[section]}
                        <Text className="font-normal text-secondary-foreground tabular-nums">{` · ${count}`}</Text>
                    </Text>
                    <Text maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
                        {caption}
                    </Text>
                </View>
                <Icon icon={chevron} size={18} className="text-secondary-foreground" />
            </HapticPressable>
        </View>
    );
};
