import { RuleConditionFieldEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SUGGEST_RULE_CONDITION_FIELD_LABELS } from '../../constant/suggest-rule-condition-field-labels.constant';

interface Props {
    readonly field: RuleConditionFieldEnum;
    readonly value: string;
}

export const SuggestRuleDescriptionCondition = ({ field, value }: Props) => {
    const { t } = useLingui();
    const fieldLabel = t(SUGGEST_RULE_CONDITION_FIELD_LABELS[field as keyof typeof SUGGEST_RULE_CONDITION_FIELD_LABELS]);

    return (
        <Text className="text-sm text-primary">
            <Trans>
                {fieldLabel} contains &quot;{value}&quot;
            </Trans>
        </Text>
    );
};
