import { CategoryEntityInterface, RuleConditionFieldEnum, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { SuggestRuleDescriptionActions } from '../suggest-rule-description-actions/suggest-rule-description-actions';
import { SuggestRuleDescriptionCondition } from '../suggest-rule-description-condition/suggest-rule-description-condition';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly selectedFields: RuleConditionFieldEnum[];
    readonly category: CategoryEntityInterface | null;
    readonly tags: TagEntityInterface[] | null;
}

export const SuggestRuleDescriptionContent = ({ data, selectedFields, category, tags }: Props) => (
    <Text className="text-sm text-secondary-foreground">
        <Trans>If </Trans>
        {selectedFields.map((field, index) => (
            <SuggestRuleDescriptionCondition key={field} data={data} field={field} isLast={index === selectedFields.length - 1} />
        ))}
        <Trans>, then </Trans>
        <SuggestRuleDescriptionActions data={data} category={category} tags={tags} />
    </Text>
);
