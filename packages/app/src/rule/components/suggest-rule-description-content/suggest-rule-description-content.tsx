import { CategoryEntityInterface, RuleConditionFieldEnum, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { getSuggestRuleFieldValue } from '../../util/get-suggest-rule-field-value.util';
import { SuggestRuleDescriptionActions } from '../suggest-rule-description-actions/suggest-rule-description-actions';
import { SuggestRuleDescriptionCondition } from '../suggest-rule-description-condition/suggest-rule-description-condition';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface Props {
    readonly selectedFields: Set<SuggestRuleConditionField>;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleDescriptionContent = ({ selectedFields, suggestRuleData, category, tags }: Props) => {
    const conditions = Array.from(selectedFields)
        .map(field => {
            const value = getSuggestRuleFieldValue(field, suggestRuleData);

            return isDefined(value) ? { field, value } : null;
        })
        .filter(isDefined);

    return (
        <View className="gap-y-md">
            <Text className="text-sm font-medium text-secondary-foreground">
                <Trans>If:</Trans>
            </Text>
            <View className="pl-lg gap-y-xxs">
                {conditions.map(condition => (
                    <SuggestRuleDescriptionCondition key={condition.field} field={condition.field} value={condition.value} />
                ))}
            </View>
            <Text className="text-sm font-medium text-secondary-foreground">
                <Trans>Then:</Trans>
            </Text>
            <View className="pl-lg">
                <SuggestRuleDescriptionActions category={category} tags={tags} />
            </View>
        </View>
    );
};
