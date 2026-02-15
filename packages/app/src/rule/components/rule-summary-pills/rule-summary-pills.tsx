import {
    RuleActionWithRelationsEntityInterface,
    RuleConditionEntityInterface,
    RuleConditionMatchTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { RuleActionPill } from '../rule-action-pill/rule-action-pill';
import { RuleConditionPill } from '../rule-condition-pill/rule-condition-pill';

interface Props {
    readonly conditions: Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value' | 'id'>[];
    readonly actions: RuleActionWithRelationsEntityInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
}

const ARROW_ICON_SIZE = 14;

export const RuleSummaryPills = ({ conditions, actions, conditionMatchType }: Props) => {
    const isMatchAll = conditionMatchType === RuleConditionMatchTypeEnum.ALL;

    return (
        <View className="flex-row flex-wrap items-center gap-sm">
            {/* jscpd:ignore-start */}
            {conditions.map((condition, index) => {
                const isLast = index === conditions.length - 1;

                return (
                    <Fragment key={condition.id}>
                        <RuleConditionPill condition={condition} />
                        {isLast ? null : (
                            <Text className="text-xs text-secondary-foreground">{isMatchAll ? <Trans>and</Trans> : <Trans>or</Trans>}</Text>
                        )}
                    </Fragment>
                );
            })}
            {/* jscpd:ignore-end */}

            <Icon icon={UserIconNameEnum.ArrowRight} size={ARROW_ICON_SIZE} className="text-secondary-foreground" />

            {actions.map(action => (
                <RuleActionPill key={action.id} action={action} />
            ))}
        </View>
    );
};
