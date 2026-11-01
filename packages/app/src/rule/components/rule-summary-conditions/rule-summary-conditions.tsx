import { RuleConditionCreateInputInterface, RuleConditionFieldEnum, RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text } from 'react-native';

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
    const remainingLabel = t`${joiner} ${remainingCount} more`;
    const currencySuffix = t`in account currency`;

    return (
        <>
            {conditions.slice(0, MAX_SPELLED_CONDITIONS).map((condition, index) => {
                const label = formatCondition(condition);
                const previous = conditions.at(index - 1);
                const isSamePredicate = index > 0 && previous?.field === condition.field && previous.operator === condition.operator;
                const valueClassName = label.hasValue ? 'text-primary' : 'text-secondary-foreground';
                const valueLabel = label.hasValue ? label.value : t`something`;

                return (
                    <Fragment key={`condition-${index}`}>
                        {index > 0 ? ` ${joiner} ` : null}
                        {isSamePredicate ? null : <Text className="text-primary">{`${label.field} ${label.operator} `}</Text>}
                        <Text className={valueClassName}>{valueLabel}</Text>
                        {condition.field === RuleConditionFieldEnum.AMOUNT ? ` ${currencySuffix}` : null}
                    </Fragment>
                );
            })}
            {remainingCount > 0 ? `, ${remainingLabel}` : null}
        </>
    );
};
