import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RULE_CONDITION_MATCH_TYPE_LABELS } from '../../constant/rule-condition-match-type-labels.constant';

export const RuleConditionMatchTypeSelector = () => {
    const { i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const options = [
        { value: RuleConditionMatchTypeEnum.ALL, label: i18n.t(RULE_CONDITION_MATCH_TYPE_LABELS[RuleConditionMatchTypeEnum.ALL]) },
        { value: RuleConditionMatchTypeEnum.ANY, label: i18n.t(RULE_CONDITION_MATCH_TYPE_LABELS[RuleConditionMatchTypeEnum.ANY]) }
    ];

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'conditionMatchType'>) => (
        <SegmentedTabs options={options} value={value} onChange={onChange} />
    );

    return <Controller control={control} name="conditionMatchType" render={renderSelector} />;
};
