import { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { RuleSummaryPills } from '../rule-summary-pills/rule-summary-pills';

interface Props {
    readonly rule: RuleWithActionsRelationsEntityInterface;
    readonly order: number;
    readonly onOpen: (rule: RuleWithActionsRelationsEntityInterface) => void;
    readonly testID?: string;
    readonly switchTestID?: string;
    readonly orderBadgeTestID?: string;
}

export const RuleCard = ({ onOpen, order, rule, testID, switchTestID, orderBadgeTestID }: Props) => {
    const handleOpen = () => void onOpen(rule);

    const handleToggle = async (enabled: boolean) => {
        await ruleRepository.updateById(rule.id, { enabled });
    };

    return (
        <Card testID={testID} onPress={handleOpen} size="md" className="flex-row items-start gap-x-lg">
            <View
                testID={orderBadgeTestID}
                className="w-10 h-10 rounded-full bg-secondary-foreground/20 items-center justify-center border border-secondary-foreground"
            >
                <Text className="text-sm font-semibold text-primary">{order}</Text>
            </View>

            <View className="flex-1">
                <RuleSummaryPills conditions={rule.conditions} actions={rule.actions} conditionMatchType={rule.conditionMatchType} />
            </View>

            <View testID={switchTestID} className="flex-row items-center justify-end">
                <ThemedSwitch value={rule.enabled} onValueChange={handleToggle} />
            </View>
        </Card>
    );
};
