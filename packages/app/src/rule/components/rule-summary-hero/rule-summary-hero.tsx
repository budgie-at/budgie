import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleActionPhrase } from '../rule-action-phrase/rule-action-phrase';
import { RuleConditionPhrase } from '../rule-condition-phrase/rule-condition-phrase';

const MAX_SPELLED_CONDITIONS = 2;

export const RuleSummaryHero = () => {
    const { t } = useLingui();
    const [conditions, actions, matchType] = useWatch<RuleCreateInputInterface, ['conditions', 'actions', 'conditionMatchType']>({
        name: ['conditions', 'actions', 'conditionMatchType']
    });
    const conditionJoiner = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const lastActionIndex = actions.length - 1;
    const actionJoiner = t`and`;
    const conditionCount = conditions.length;
    const isCompact = conditionCount > MAX_SPELLED_CONDITIONS;
    const compactConditions =
        matchType === RuleConditionMatchTypeEnum.ALL
            ? t({ message: plural(conditionCount, { one: 'all # conditions match', other: 'all # conditions match' }) })
            : t({ message: plural(conditionCount, { one: 'any of # conditions matches', other: 'any of # conditions matches' }) });

    return (
        <View className="px-3xl">
            <Text
                className="text-[17px] leading-[24px] font-semibold text-secondary-foreground"
                accessibilityRole="summary"
                numberOfLines={3}
                ellipsizeMode="tail"
            >
                {t`When`}{' '}
                {isCompact ? (
                    <Text className="text-primary">{compactConditions}</Text>
                ) : (
                    conditions.map((condition, index) => (
                        <Fragment key={`condition-${index}`}>
                            {index > 0 ? ` ${conditionJoiner} ` : null}
                            <RuleConditionPhrase condition={condition} />
                        </Fragment>
                    ))
                )}
                {', '}
                {t`then`}{' '}
                {actions.map((action, index) => (
                    <Fragment key={`action-${index}`}>
                        {index > 0 && index === lastActionIndex ? ` ${actionJoiner} ` : null}
                        {index > 0 && index < lastActionIndex ? ', ' : null}
                        <RuleActionPhrase action={action} />
                    </Fragment>
                ))}
            </Text>
        </View>
    );
};
