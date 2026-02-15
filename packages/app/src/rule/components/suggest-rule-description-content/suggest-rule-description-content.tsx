import {
    CategoryEntityInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    TagEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { getSuggestRuleFieldValue } from '../../util/get-suggest-rule-field-value.util';
import { RuleConditionPill } from '../rule-condition-pill/rule-condition-pill';
import { SuggestRuleActionPills } from '../suggest-rule-action-pills/suggest-rule-action-pills';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface Props {
    readonly selectedFields: Set<SuggestRuleConditionField>;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

const ARROW_ICON_SIZE = 14;

export const SuggestRuleDescriptionContent = ({ selectedFields, suggestRuleData, category, tags }: Props) => {
    const conditions = Array.from(selectedFields)
        .map(field => {
            const value = getSuggestRuleFieldValue(field, suggestRuleData);

            return isDefined(value) ? { field, operator: RuleConditionOperatorEnum.CONTAINS, value } : null;
        })
        .filter(isDefined);

    return (
        <View className="flex-row flex-wrap items-center gap-sm">
            {conditions.map((condition, index) => {
                const isLast = index === conditions.length - 1;

                return (
                    <Fragment key={condition.field}>
                        <RuleConditionPill condition={condition} />
                        {isLast ? null : (
                            <Text className="text-xs text-secondary-foreground">
                                <Trans>and</Trans>
                            </Text>
                        )}
                    </Fragment>
                );
            })}

            <Icon icon={UserIconNameEnum.ArrowRight} size={ARROW_ICON_SIZE} className="text-secondary-foreground" />

            <SuggestRuleActionPills category={category} tags={tags} />
        </View>
    );
};
