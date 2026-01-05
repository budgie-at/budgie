import { CategoryEntityInterface, RuleConditionFieldEnum, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

import { SuggestRuleDescriptionActions } from './suggest-rule-description-actions';
import { SuggestRuleDescriptionConditions } from './suggest-rule-description-conditions';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly selectedFields: RuleConditionFieldEnum[];
    readonly category: CategoryEntityInterface | null;
    readonly tags: TagEntityInterface[] | null;
}

export const SuggestRuleDescriptionContent = ({ data, selectedFields, category, tags }: Props) => (
    <Text className="text-sm text-secondary-foreground">
        <Trans>If{' '}</Trans>
        <SuggestRuleDescriptionConditions data={data} selectedFields={selectedFields} />
        <Trans>, then{' '}</Trans>
        <SuggestRuleDescriptionActions data={data} category={category} tags={tags} />
    </Text>
);
