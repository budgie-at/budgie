import { CategoryEntityInterface, RuleConditionFieldEnum, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { buildActionPillParts } from '../../util/build-action-pill-parts.util';
import { buildConditionParts } from '../../util/build-condition-parts.util';
import { joinWithSeparators } from '../../util/join-with-separators.util';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

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
        <Text className="text-xs text-secondary-foreground leading-relaxed">
            <Trans>When</Trans> {conditionsJoined}
            {hasActions ? (
                <>
                    {' → '}
                    <Trans>set</Trans> {actionsJoined}
                </>
            ) : null}
        </Text>
    );
};
