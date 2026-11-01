import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

export const RuleConditionMatchTypeSelector = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'conditionMatchType' });

    const options = [
        { value: RuleConditionMatchTypeEnum.ALL, label: t`All conditions` },
        { value: RuleConditionMatchTypeEnum.ANY, label: t`Any condition` }
    ];

    return (
        <View testID={RuleFormSelector.MatchTypeSelector} className="px-3xl py-md">
            <SegmentedTabs options={options} value={value} onChange={onChange} />
        </View>
    );
};
