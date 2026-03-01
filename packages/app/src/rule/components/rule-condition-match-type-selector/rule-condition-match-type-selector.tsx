import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RULE_CONDITION_MATCH_TYPE_LABELS } from '../../constant/rule-condition-match-type-labels.constant';

export const RuleConditionMatchTypeSelector = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const options = [
        { value: RuleConditionMatchTypeEnum.ALL, label: t(RULE_CONDITION_MATCH_TYPE_LABELS[RuleConditionMatchTypeEnum.ALL]) },
        { value: RuleConditionMatchTypeEnum.ANY, label: t(RULE_CONDITION_MATCH_TYPE_LABELS[RuleConditionMatchTypeEnum.ANY]) }
    ];

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'conditionMatchType'>) => (
        <View testID={RuleFormSelectors.MatchTypeSelector}>
            <SegmentedTabs options={options} value={value} onChange={onChange} />
        </View>
    );

    return <Controller control={control} name="conditionMatchType" render={renderSelector} />;
};
