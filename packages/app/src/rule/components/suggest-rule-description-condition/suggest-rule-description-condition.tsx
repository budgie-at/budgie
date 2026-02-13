import { RuleConditionFieldEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SUGGEST_RULE_CONDITION_FIELD_LABELS } from '../../constant/suggest-rule-condition-field-labels.constant';
import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly field: RuleConditionFieldEnum;
    readonly value: string;
}

export const SuggestRuleDescriptionCondition = ({ field, value }: Props) => {
    const { t } = useLingui();
    const fieldDescriptor = SUGGEST_RULE_CONDITION_FIELD_LABELS[field];
    const fieldLabel = isDefined(fieldDescriptor) ? t(fieldDescriptor) : '';

    return (
        <Text className="text-sm text-primary">
            <Trans>
                {fieldLabel} contains &quot;{value}&quot;
            </Trans>
        </Text>
    );
};
