import { RuleConditionCreateInputInterface, RuleConditionFieldEnum, RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text } from 'react-native';

import { RULE_CONDITION_VALUE_MARKER } from '../../constant/rule-condition-value-marker.constant';
import { useRuleConditionFormatter } from '../../hooks/use-rule-condition-formatter.hook';

interface Props {
    readonly conditions: readonly RuleConditionCreateInputInterface[];
    readonly matchType: RuleConditionMatchTypeEnum;
}

const MAX_SPELLED_CONDITIONS = 2;

export const RuleSummaryConditions = ({ conditions, matchType }: Props) => {
    const { t } = useLingui();
    const formatCondition = useRuleConditionFormatter();
    const joiner = matchType === RuleConditionMatchTypeEnum.ALL ? t`and` : t`or`;
    const remainingCount = conditions.length - MAX_SPELLED_CONDITIONS;
    const remainingLabel =
        matchType === RuleConditionMatchTypeEnum.ALL
            ? t({ message: plural(remainingCount, { one: 'and # other condition', other: 'and # other conditions' }) })
            : t({ message: plural(remainingCount, { one: 'or # other condition', other: 'or # other conditions' }) });
    const currencySuffix = t`in account currency`;

    return (
        <>
            {conditions.slice(0, MAX_SPELLED_CONDITIONS).map((condition, index) => {
                const label = formatCondition(condition);
                const previous = conditions.at(index - 1);
                const isSamePredicate = index > 0 && previous?.field === condition.field && previous.operator === condition.operator;
                const valueClassName = label.hasValue ? 'text-primary' : 'text-secondary-foreground';
                const valueLabel = label.hasValue ? label.value : t`something`;
                const [before = '', after = ''] = label.phraseTemplate.split(RULE_CONDITION_VALUE_MARKER);

                return (
                    <Fragment key={`condition-${index}`}>
                        {index > 0 ? ` ${joiner} ` : null}
                        {isSamePredicate ? null : <Text className="text-primary">{before}</Text>}
                        <Text className={valueClassName}>{valueLabel}</Text>
                        {isSamePredicate ? null : <Text className="text-primary">{after}</Text>}
                        {condition.field === RuleConditionFieldEnum.AMOUNT ? ` ${currencySuffix}` : null}
                    </Fragment>
                );
            })}
            {remainingCount > 0 ? ` ${remainingLabel}` : null}
        </>
    );
};
