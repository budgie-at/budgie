import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useRuleConditionLabel } from '../../hooks/use-rule-condition-label.hook';

import type { RuleConditionCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly condition: RuleConditionCreateInputInterface;
}

export const RuleConditionPhrase = ({ condition }: Props) => {
    const { field, operator, value, hasValue } = useRuleConditionLabel(condition);
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
