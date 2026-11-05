import { useState } from 'react';
import { View } from 'react-native';

import { RecurringViewModeEnum } from '../../enum/recurring-view-mode.enum';
import { RecurringCalendarContent } from '../recurring-calendar-content/recurring-calendar-content';
import { RecurringListContent } from '../recurring-list-content/recurring-list-content';
import { RecurringPaneToolbar } from '../recurring-pane-toolbar/recurring-pane-toolbar';

import { RecurringPaneSelector } from './recurring-pane.selector';

export const RecurringPane = () => {
    const [viewMode, setViewMode] = useState(RecurringViewModeEnum.LIST);
    const isListMode = viewMode === RecurringViewModeEnum.LIST;

    const handleToggleViewMode = () =>
        void setViewMode(current => (current === RecurringViewModeEnum.LIST ? RecurringViewModeEnum.CALENDAR : RecurringViewModeEnum.LIST));

    return (
        <View className="flex-1" testID={RecurringPaneSelector.Container}>
            <RecurringPaneToolbar viewMode={viewMode} onToggleViewMode={handleToggleViewMode} />
            {isListMode ? <RecurringListContent /> : <RecurringCalendarContent />}
        </View>
    );
};
