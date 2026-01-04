import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';

export const RuleConditionMatchTypeSelector = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const options = [
        { value: RuleConditionMatchTypeEnum.ALL, label: t`Match All` },
        { value: RuleConditionMatchTypeEnum.ANY, label: t`Match Any` }
    ];

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'conditionMatchType'>) => (
        <SegmentedTabs options={options} value={value} onChange={onChange} />
    );

    return <Controller control={control} name="conditionMatchType" render={renderSelector} />;
};
