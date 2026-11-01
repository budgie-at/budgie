import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useRuleConditionFormatter } from '../../hooks/use-rule-condition-formatter.hook';

import type { RuleConditionCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly condition: RuleConditionCreateInputInterface;
}

export const RuleConditionPhrase = ({ condition }: Props) => {
    const { field, operator, value, hasValue } = useRuleConditionFormatter()(condition);
    const { t } = useLingui();
    const valueClassName = hasValue ? 'text-primary' : 'text-secondary-foreground';
    const valueLabel = hasValue ? value : t`something`;

    return (
        <>
            <Text className="text-primary">
                {field} {operator}{' '}
            </Text>
            <Text className={valueClassName}>{valueLabel}</Text>
        </>
    );
};
