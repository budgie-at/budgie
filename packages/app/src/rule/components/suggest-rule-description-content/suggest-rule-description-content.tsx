import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SuggestRuleConditionField } from '../../constant/suggest-rule-condition-fields.constant';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { buildActionPillParts } from '../../util/build-action-pill-parts.util';
import { buildConditionParts } from '../../util/build-condition-parts.util';
import { joinWithSeparators } from '../../util/join-with-separators.util';

interface Props {
    readonly selectedFields: Set<SuggestRuleConditionField>;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleDescriptionContent = ({ selectedFields, suggestRuleData, category, tags }: Props) => {
    const { t } = useLingui();

    const conditionParts = buildConditionParts(selectedFields, suggestRuleData, t);
    const conditionsJoined = joinWithSeparators(conditionParts);

    const hasActions = isDefined(category) || isNotEmptyArray(tags);
    const actionParts = buildActionPillParts(category, tags);
    const actionsJoined = joinWithSeparators(actionParts);

    return (
        <View className="gap-y-sm">
            <Text className="text-sm text-primary font-medium leading-loose">
                <Trans>Match transactions where</Trans>
            </Text>
            <Text className="text-sm text-secondary-foreground leading-loose">{conditionsJoined}</Text>
            {hasActions ? (
                <Text className="text-sm text-secondary-foreground leading-loose">
                    <Trans>then set</Trans> {actionsJoined}
                </Text>
            ) : null}
        </View>
    );
};
