import { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { RuleSummaryPills } from '../rule-summary-pills/rule-summary-pills';

interface Props {
    readonly rule: RuleWithActionsRelationsEntityInterface;
    readonly onOpen: (rule: RuleWithActionsRelationsEntityInterface) => void;
    readonly onToggle: (rule: RuleWithActionsRelationsEntityInterface, enabled: boolean) => void;
    readonly testID?: string;
    readonly switchTestID?: string;
    readonly conditionsTestID?: string;
    readonly actionsTestID?: string;
}

export const RuleCard = ({ onOpen, onToggle, rule, testID, switchTestID, conditionsTestID, actionsTestID }: Props) => {
    const handleOpen = () => void onOpen(rule);
    const handleToggle = (enabled: boolean) => void onToggle(rule, enabled);

    return (
        <Card testID={testID} onPress={handleOpen} size="md" className="flex-row items-start gap-x-lg">
            <View className="flex-1">
                <RuleSummaryPills
                    conditions={rule.conditions}
                    actions={rule.actions}
                    conditionMatchType={rule.conditionMatchType}
                    conditionsTestID={conditionsTestID}
                    actionsTestID={actionsTestID}
                />
            </View>

            <View testID={switchTestID} className="flex-row items-center justify-end">
                <ThemedSwitch value={rule.enabled} onValueChange={handleToggle} />
            </View>
        </Card>
    );
};
