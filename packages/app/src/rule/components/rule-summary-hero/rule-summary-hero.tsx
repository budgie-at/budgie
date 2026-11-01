import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleActionPhrase } from '../rule-action-phrase/rule-action-phrase';
import { RuleSummaryConditions } from '../rule-summary-conditions/rule-summary-conditions';

export const RuleSummaryHero = () => {
    const { t } = useLingui();
    const [conditions, actions, matchType] = useWatch<RuleCreateInputInterface, ['conditions', 'actions', 'conditionMatchType']>({
        name: ['conditions', 'actions', 'conditionMatchType']
    });
    const lastActionIndex = actions.length - 1;
    const actionJoiner = t`and`;

    return (
        <View className="px-3xl">
            <Text
                className="text-[17px] leading-[24px] font-semibold text-secondary-foreground"
                accessibilityRole="summary"
                numberOfLines={3}
                ellipsizeMode="tail"
            >
                {t`When`} <RuleSummaryConditions conditions={conditions} matchType={matchType} />
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
