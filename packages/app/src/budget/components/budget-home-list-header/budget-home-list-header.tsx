import { View } from 'react-native';

import { useFocusKey } from '../../../@generic/hook/use-focus-key.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { BudgetWidget } from '../budget-widget/budget-widget';

export const BudgetHomeListHeader = () => {
    const language = useSetting('language');
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');
    const focusKey = useFocusKey();
    const budgetWidgetRemountKey = `${language}-${isBudgetWidgetEnabled ? 'enabled' : 'disabled'}-${focusKey}`;

    return (
        <View className="mb-3xl">
            <BudgetWidget key={budgetWidgetRemountKey} />
        </View>
    );
};
