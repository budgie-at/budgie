import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { MultiSelectChip } from '../../../@generic/component/multi-select-chip/multi-select-chip';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

interface Props {
    readonly data: SuggestRuleDataInterface | null;
    readonly selectedFields: RuleConditionFieldEnum[];
    readonly onToggleField: (field: RuleConditionFieldEnum) => void;
    readonly hasComment: boolean;
    readonly hasMccCode: boolean;
}

export const SuggestRuleConditionSelector = ({ data, selectedFields, onToggleField, hasComment, hasMccCode }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem label={t`Match transactions by:`} className="mt-3xl">
            <View className="flex-row flex-wrap gap-md">
                <MultiSelectChip
                    identifier={RuleConditionFieldEnum.TITLE}
                    onToggle={onToggleField}
                    isSelected={selectedFields.includes(RuleConditionFieldEnum.TITLE)}
                    label={t`Title`}
                    value={data?.title}
                />

                {hasComment ? (
                    <MultiSelectChip
                        identifier={RuleConditionFieldEnum.COMMENT}
                        onToggle={onToggleField}
                        isSelected={selectedFields.includes(RuleConditionFieldEnum.COMMENT)}
                        label={t`Comment`}
                        value={data?.comment ?? ''}
                    />
                ) : null}

                {hasMccCode ? (
                    <MultiSelectChip
                        identifier={RuleConditionFieldEnum.MCC_CODE}
                        onToggle={onToggleField}
                        isSelected={selectedFields.includes(RuleConditionFieldEnum.MCC_CODE)}
                        label={t`MCC Code`}
                        value={data?.mccCode ?? ''}
                    />
                ) : null}
            </View>
        </FormItem>
    );
};
