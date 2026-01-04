import {
    CategoryEntityInterface,
    RuleActionEntityInterface,
    RuleActionTypeEnum,
    RuleConditionEntityInterface,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleEntityInterface,
    TagEntityInterface
} from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { ruleService } from '../../service/rule.service';

interface RuleActionWithRelationsInterface extends RuleActionEntityInterface {
    readonly category?: CategoryEntityInterface | null;
    readonly tag?: TagEntityInterface | null;
}

interface RuleWithRelationsInterface extends RuleEntityInterface {
    readonly conditions: RuleConditionEntityInterface[];
    readonly actions: RuleActionWithRelationsInterface[];
}

interface Props {
    readonly rule: RuleWithRelationsInterface;
    readonly order: number;
    readonly onOpen: (rule: RuleWithRelationsInterface) => void;
}

const FIELD_LABELS = {
    [RuleConditionFieldEnum.TITLE]: msg`Title`,
    [RuleConditionFieldEnum.AMOUNT]: msg`Amount`,
    [RuleConditionFieldEnum.ACCOUNT_ID]: msg`Account`,
    [RuleConditionFieldEnum.MCC_CODE]: msg`MCC Code`,
    [RuleConditionFieldEnum.TRANSACTION_TYPE]: msg`Type`,
    [RuleConditionFieldEnum.EXTERNAL_SOURCE]: msg`Source`
};

const OPERATOR_LABELS = {
    [RuleConditionOperatorEnum.EQUALS]: msg`equals`,
    [RuleConditionOperatorEnum.NOT_EQUALS]: msg`not equals`,
    [RuleConditionOperatorEnum.CONTAINS]: msg`contains`,
    [RuleConditionOperatorEnum.NOT_CONTAINS]: msg`not contains`,
    [RuleConditionOperatorEnum.MATCHES_REGEX]: msg`matches`,
    [RuleConditionOperatorEnum.GREATER_THAN]: msg`>`,
    [RuleConditionOperatorEnum.LESS_THAN]: msg`<`,
    [RuleConditionOperatorEnum.BETWEEN]: msg`between`,
    [RuleConditionOperatorEnum.IN]: msg`in`
};

export const RuleCard = ({ onOpen, order, rule }: Props) => {
    const { t, i18n } = useLingui();
    const handleOpen = () => void onOpen(rule);

    const handleToggle = async (enabled: boolean) => {
        await ruleService.setEnabled(rule.id, enabled);
    };

    const renderCondition = (condition: RuleConditionEntityInterface) => {
        const { field, operator, value } = condition;
        const fieldLabel = i18n.t(FIELD_LABELS[field]);
        const operatorLabel = i18n.t(OPERATOR_LABELS[operator]);

        return (
            <View key={condition.id} className="flex-row items-center gap-x-sm">
                <Text className="text-xs text-secondary-foreground">|</Text>
                <Text className="text-xs text-secondary-foreground">
                    <Text className="font-semibold text-primary">{fieldLabel}</Text>
                    <Text> {operatorLabel} </Text>
                    <Text className="font-semibold text-primary">&quot;{value}&quot;</Text>
                </Text>
            </View>
        );
    };

    const renderAction = (action: RuleActionWithRelationsInterface) => {
        if (action.type === RuleActionTypeEnum.SET_CATEGORY && isDefined(action.category)) {
            const categoryTitle = action.category.title;

            return (
                <View key={action.id} className="flex-row items-center gap-x-sm">
                    <Text className="text-xs text-secondary-foreground">|</Text>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>
                            set category to <Text className="font-semibold text-primary">{categoryTitle}</Text>
                        </Trans>
                    </Text>
                </View>
            );
        }

        if (action.type === RuleActionTypeEnum.ADD_TAG && isDefined(action.tag)) {
            const tagTitle = action.tag.title;

            return (
                <View key={action.id} className="flex-row items-center gap-x-sm">
                    <Text className="text-xs text-secondary-foreground">|</Text>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>
                            add tag <Text className="font-semibold text-primary">{tagTitle}</Text>
                        </Trans>
                    </Text>
                </View>
            );
        }

        return null;
    };

    const matchTypeLabel = rule.conditionMatchType === RuleConditionMatchTypeEnum.ALL ? t`If all of:` : t`If any of:`;

    return (
        <Card onPress={handleOpen} size="md" className="flex-row items-start gap-x-lg">
            <View className="w-10 h-10 rounded-full bg-secondary-foreground/20 items-center justify-center border border-secondary-foreground">
                <Text className="text-sm font-semibold text-primary">{order}</Text>
            </View>

            <View className="flex-1 gap-y-lg">
                <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-primary flex-1">{rule.title}</Text>
                    <ThemedSwitch value={rule.enabled} onValueChange={handleToggle} />
                </View>

                <View className="gap-y-xs">
                    <Text className="text-xs font-medium text-secondary-foreground">{matchTypeLabel}</Text>
                    <View className="pl-lg gap-y-xs">{rule.conditions.map(renderCondition)}</View>
                </View>

                <View className="gap-y-xs">
                    <Text className="text-xs font-medium text-secondary-foreground">
                        <Trans>Then:</Trans>
                    </Text>
                    <View className="pl-lg gap-y-xs">{rule.actions.map(renderAction)}</View>
                </View>
            </View>
        </Card>
    );
};
