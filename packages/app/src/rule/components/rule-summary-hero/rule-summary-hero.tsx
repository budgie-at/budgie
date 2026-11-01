import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleActionPhrase } from '../rule-action-phrase/rule-action-phrase';
import { RuleConditionPhrase } from '../rule-condition-phrase/rule-condition-phrase';

export const RuleSummaryHero = () => {
    const { t } = useLingui();
    const [conditions, actions, matchType] = useWatch<RuleCreateInputInterface, ['conditions', 'actions', 'conditionMatchType']>({
        name: ['conditions', 'actions', 'conditionMatchType']
    });
    const conditionJoiner = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const lastActionIndex = actions.length - 1;
    const actionJoiner = t`and`;

    return (
        <View className="gap-y-sm px-xs pb-xs">
            <Text className="text-[15px] font-semibold text-secondary-foreground">{t`In short`}</Text>
            <Text className="text-[22px] leading-[30px] font-medium text-secondary-foreground" accessibilityRole="summary">
                {t`When`}{' '}
                {conditions.map((condition, index) => (
                    <Fragment key={`condition-${index}`}>
                        {index > 0 ? ` ${conditionJoiner} ` : null}
                        <RuleConditionPhrase condition={condition} />
                    </Fragment>
                ))}
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
