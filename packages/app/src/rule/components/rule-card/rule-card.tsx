import { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { ruleService } from '../../service/rule.service';
import { RuleSummaryPills } from '../rule-summary-pills/rule-summary-pills';

interface Props {
    readonly rule: RuleWithActionsRelationsEntityInterface;
    readonly onOpen: (rule: RuleWithActionsRelationsEntityInterface) => void;
    readonly testID?: string;
    readonly switchTestID?: string;
    readonly conditionsTestID?: string;
    readonly actionsTestID?: string;
}

export const RuleCard = ({ onOpen, rule, testID, switchTestID, conditionsTestID, actionsTestID }: Props) => {
    const handleOpen = () => void onOpen(rule);

    const handleToggle = async (enabled: boolean) => {
        try {
            await ruleService.toggleEnabled(rule.id, enabled);
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not update rule`, text2: getErrorMessage(error) });
        }
    };

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
