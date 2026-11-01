import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

import type { RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly rules: readonly Pick<RuleWithActionsRelationsEntityInterface, 'enabled'>[];
    readonly matchingRulesCount: number;
}

export const RulesListHeader = ({ rules, matchingRulesCount }: Props) => {
    const { t } = useLingui();
    const enabledCount = rules.filter(rule => rule.enabled).length;
    const rulesCountLabel = t({ message: plural(rules.length, { one: '# rule', other: '# rules' }) });
    const matchingRulesLabel = t({ message: plural(matchingRulesCount, { one: '# matching rule', other: '# matching rules' }) });

    return (
        <View className="gap-y-lg">
            {isPositiveNumber(matchingRulesCount) ? (
                <View className="items-start" testID={RulesPageSelector.MatchingRulesFilter}>
                    <RuleIndicatorPill icon={UserIconNameEnum.Workflow}>{matchingRulesLabel}</RuleIndicatorPill>
                </View>
            ) : null}
            <Text className="text-secondary-foreground px-3xl pb-md text-[15px] font-semibold" accessibilityRole="header">
                {t`${rulesCountLabel} · ${enabledCount} on`}
            </Text>
        </View>
    );
};
