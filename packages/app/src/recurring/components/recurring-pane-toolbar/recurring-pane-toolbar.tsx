import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { RecurringViewModeEnum } from '../../enum/recurring-view-mode.enum';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';

interface Props {
    readonly viewMode: RecurringViewModeEnum;
    readonly onChangeViewMode: (viewMode: RecurringViewModeEnum) => void;
}

export const RecurringPaneToolbar = ({ viewMode, onChangeViewMode }: Props) => {
    const { t } = useLingui();
    const segments = [
        { value: RecurringViewModeEnum.LIST, label: t`List`, testID: RecurringPaneSelector.ListModeButton },
        { value: RecurringViewModeEnum.CALENDAR, label: t`Calendar`, testID: RecurringPaneSelector.CalendarModeButton }
    ];

    return (
        <View className="px-3xl pt-xs pb-md">
            <SegmentedControl segments={segments} value={viewMode} onChange={onChangeViewMode} />
        </View>
    );
};
