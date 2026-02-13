import { RuleConditionMatchTypeEnum, RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { RuleCardAction } from '../rule-card-action/rule-card-action';
import { RuleCardCondition } from '../rule-card-condition/rule-card-condition';

interface Props {
    readonly rule: RuleWithActionsRelationsEntityInterface;
    readonly order: number;
    readonly onOpen: (rule: RuleWithActionsRelationsEntityInterface) => void;
    readonly testID?: string;
    readonly switchTestID?: string;
    readonly orderBadgeTestID?: string;
    readonly conditionsTestID?: string;
    readonly actionsTestID?: string;
}

export const RuleCard = ({ onOpen, order, rule, testID, switchTestID, orderBadgeTestID, conditionsTestID, actionsTestID }: Props) => {
    const { t } = useLingui();

    const handleOpen = () => void onOpen(rule);

    const handleToggle = async (enabled: boolean) => {
        await ruleRepository.updateById(rule.id, { enabled });
    };

    const matchTypeLabel = rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL ? t`If all of:` : t`If any of:`;

    return (
        <Card testID={testID} onPress={handleOpen} size="md" className="flex-row items-start gap-x-lg">
            <View
                testID={orderBadgeTestID}
                className="w-10 h-10 rounded-full bg-secondary-foreground/20 items-center justify-center border border-secondary-foreground"
            >
                <Text className="text-sm font-semibold text-primary">{order}</Text>
            </View>

            <View className="flex-1 gap-y-lg">
                <View testID={conditionsTestID} className="gap-y-xs">
                    <Text className="text-xs font-medium text-secondary-foreground">{matchTypeLabel}</Text>
                    <View className="pl-lg gap-y-xs">
                        {rule.conditions.map(condition => (
                            <RuleCardCondition key={condition.id} condition={condition} />
                        ))}
                    </View>
                </View>

                <View testID={actionsTestID} className="gap-y-xs">
                    <Text className="text-xs font-medium text-secondary-foreground">
                        <Trans>Then:</Trans>
                    </Text>
                    <View className="pl-lg gap-y-xs">
                        {rule.actions.map(action => (
                            <RuleCardAction key={action.id} action={action} />
                        ))}
                    </View>
                </View>
            </View>

            <View testID={switchTestID} className="flex-row items-center justify-end">
                <ThemedSwitch value={rule.enabled} onValueChange={handleToggle} />
            </View>
        </Card>
    );
};
