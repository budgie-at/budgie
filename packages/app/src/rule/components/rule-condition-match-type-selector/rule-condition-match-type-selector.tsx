import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

const RULE_CONDITION_MATCH_TYPE_LABELS: Record<RuleConditionMatchTypeEnum, MessageDescriptor> = {
    [RuleConditionMatchTypeEnum.ALL]: msg`Match All`,
    [RuleConditionMatchTypeEnum.ANY]: msg`Match Any`
};

export const RuleConditionMatchTypeSelector = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const options = [
        { value: RuleConditionMatchTypeEnum.ALL, label: t(RULE_CONDITION_MATCH_TYPE_LABELS[RuleConditionMatchTypeEnum.ALL]) },
        { value: RuleConditionMatchTypeEnum.ANY, label: t(RULE_CONDITION_MATCH_TYPE_LABELS[RuleConditionMatchTypeEnum.ANY]) }
    ];

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'conditionMatchType'>) => (
        <View testID={RuleFormSelector.MatchTypeSelector}>
            <SegmentedTabs options={options} value={value} onChange={onChange} />
        </View>
    );

    return <Controller control={control} name="conditionMatchType" render={renderSelector} />;
};
