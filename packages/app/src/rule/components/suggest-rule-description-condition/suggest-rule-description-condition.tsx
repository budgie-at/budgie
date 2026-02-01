import { RuleConditionFieldEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SUGGEST_RULE_FIELD } from '../../constant/suggest-rule-field.constant';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { getSuggestRuleFieldValue } from '../../util/get-suggest-rule-field-value.util';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly field: RuleConditionFieldEnum;
    readonly isLast: boolean;
}

export const SuggestRuleDescriptionCondition = ({ data, field, isLast }: Props) => {
    const { t } = useLingui();

    return (
        <Text className="text-sm text-secondary-foreground">
            <Text className="font-semibold text-primary">{t(SUGGEST_RULE_FIELD[field])}</Text>
            <Trans> contains </Trans>
            <Text className="font-semibold text-primary">&quot;{getSuggestRuleFieldValue(field, data)}&quot;</Text>
            {isLast ? null : <Trans> and </Trans>}
        </Text>
    );
};
