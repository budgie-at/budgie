import {
    RuleActionWithRelationsEntityInterface,
    RuleConditionEntityInterface,
    RuleConditionMatchTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { RuleActionPill } from '../rule-action-pill/rule-action-pill';

import { RuleSummaryConditionItem } from './rule-summary-condition-item';

interface Props {
    readonly conditions: Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value' | 'id'>[];
    readonly actions: RuleActionWithRelationsEntityInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
    readonly conditionsTestID?: string;
    readonly actionsTestID?: string;
}

const ARROW_ICON_SIZE = 14;

export const RuleSummaryPills = ({ conditions, actions, conditionMatchType, conditionsTestID, actionsTestID }: Props) => {
    const isMatchAll = conditionMatchType === RuleConditionMatchTypeEnum.ALL;
    const lastConditionIndex = conditions.length - 1;

    return (
        <View className="flex-row flex-wrap items-center gap-sm">
            <View testID={conditionsTestID} className="flex-row flex-wrap items-center gap-sm">
                {conditions.map((condition, index) => (
                    <RuleSummaryConditionItem
                        key={condition.id}
                        condition={condition}
                        isLast={index === lastConditionIndex}
                        isMatchAll={isMatchAll}
                    />
                ))}
            </View>

            <Icon icon={UserIconNameEnum.ArrowRight} size={ARROW_ICON_SIZE} className="text-secondary-foreground" />

            <View testID={actionsTestID} className="flex-row flex-wrap items-center gap-sm">
                {actions.map(action => (
                    <RuleActionPill key={action.id} action={action} />
                ))}
            </View>
        </View>
    );
};
