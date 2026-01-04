import { RuleConditionFieldEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
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
        <FormItem label={t`Match transactions by:`} className="gap-y-lg mt-3xl">
            <SelectorCard
                identifier={RuleConditionFieldEnum.TITLE}
                onSelect={onToggleField}
                isSelected={selectedFields.includes(RuleConditionFieldEnum.TITLE)}
                title={t`Title`}
                subtitle={
                    <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
                        {data?.title}
                    </Text>
                }
            />

            {hasComment ? (
                <SelectorCard
                    identifier={RuleConditionFieldEnum.COMMENT}
                    onSelect={onToggleField}
                    isSelected={selectedFields.includes(RuleConditionFieldEnum.COMMENT)}
                    title={t`Comment`}
                    subtitle={
                        <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
                            {data?.comment}
                        </Text>
                    }
                />
            ) : null}

            {hasMccCode ? (
                <SelectorCard
                    identifier={RuleConditionFieldEnum.MCC_CODE}
                    onSelect={onToggleField}
                    isSelected={selectedFields.includes(RuleConditionFieldEnum.MCC_CODE)}
                    title={t`MCC Code`}
                    subtitle={
                        <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
                            {data?.mccCode}
                        </Text>
                    }
                />
            ) : null}
        </FormItem>
    );
};
