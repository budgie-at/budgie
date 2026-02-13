import { CategoryEntityInterface, RuleConditionFieldEnum, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { SuggestRuleDescriptionContent } from '../suggest-rule-description-content/suggest-rule-description-content';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface Props {
    readonly hasSelectedConditions: boolean;
    readonly selectedFields: Set<SuggestRuleConditionField>;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleDescription = ({ hasSelectedConditions, selectedFields, suggestRuleData, category, tags }: Props) => (
    <View className="rounded-2xl bg-secondary-background/50 p-3xl">
        {hasSelectedConditions ? (
            <SuggestRuleDescriptionContent
                selectedFields={selectedFields}
                suggestRuleData={suggestRuleData}
                category={category}
                tags={tags}
            />
        ) : (
            <Text className="text-sm text-secondary-foreground text-center">
                <Trans>Select at least one condition</Trans>
            </Text>
        )}
    </View>
);
