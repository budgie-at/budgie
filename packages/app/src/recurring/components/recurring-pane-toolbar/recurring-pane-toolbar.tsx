import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { RecurringViewModeEnum } from '../../enum/recurring-view-mode.enum';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';

interface Props {
    readonly viewMode: RecurringViewModeEnum;
    readonly onToggleViewMode: () => void;
}

export const RecurringPaneToolbar = ({ viewMode, onToggleViewMode }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const isListMode = viewMode === RecurringViewModeEnum.LIST;
    const toggleIcon = isListMode ? UserIconNameEnum.CalendarDays : UserIconNameEnum.List;
    const toggleLabel = isListMode ? t`Show calendar` : t`Show list`;

    const handleAdd = () => void router.push('/recurring/create');

    return (
        <View className="flex-row items-center justify-end gap-x-sm pb-xs">
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={toggleLabel}
                className="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
                onPress={onToggleViewMode}
                testID={RecurringPaneSelector.ViewToggleButton}
            >
                <Icon icon={toggleIcon} size={22} className="text-primary" />
            </HapticPressable>
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={t`Add recurring payment`}
                className="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
                onPress={handleAdd}
                testID={RecurringPaneSelector.AddButton}
            >
                <Icon icon={UserIconNameEnum.Plus} size={24} className="text-primary" />
            </HapticPressable>
        </View>
    );
};
