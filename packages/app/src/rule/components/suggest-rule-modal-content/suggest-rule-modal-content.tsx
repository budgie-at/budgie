import { RuleConditionFieldEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyString } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { Button } from '../../../@generic/component/button/button';
import { typedObjectKeys } from '../../../@generic/utils/typed-object-keys.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { toggleSetItem } from '../../../sync/util/toggle-set-item.util';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { SUGGEST_RULE_CONDITION_FIELD_LABELS } from '../../constant/suggest-rule-condition-field-labels.constant';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { getSuggestRuleFieldValue } from '../../util/get-suggest-rule-field-value.util';
import { SuggestRuleConditionSelector } from '../suggest-rule-condition-selector/suggest-rule-condition-selector';
import { SuggestRuleDescription } from '../suggest-rule-description/suggest-rule-description';

type SuggestRuleConditionField = RuleConditionFieldEnum.TITLE | RuleConditionFieldEnum.COMMENT | RuleConditionFieldEnum.MCC_CODE;

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onDismiss: () => void;
    readonly onNext: (selectedFields: SuggestRuleConditionField[]) => void;
}

export const SuggestRuleModalContent = ({ suggestRuleData, onDismiss, onNext }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const { category } = useGetCategoryByIdQuery(suggestRuleData.categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(suggestRuleData.tagIds);

    const [selectedFields, setSelectedFields] = useState<Set<SuggestRuleConditionField>>(
        () =>
            new Set(
                typedObjectKeys(SUGGEST_RULE_CONDITION_FIELD_LABELS).filter((field): field is SuggestRuleConditionField =>
                    isNotEmptyString(getSuggestRuleFieldValue(field, suggestRuleData))
                )
            )
    );

    const availableFields: SuggestRuleConditionField[] = typedObjectKeys(SUGGEST_RULE_CONDITION_FIELD_LABELS).filter(
        (field): field is SuggestRuleConditionField => isNotEmptyString(getSuggestRuleFieldValue(field, suggestRuleData))
    );

    const toggleField = (field: SuggestRuleConditionField) => {
        setSelectedFields(previous => toggleSetItem(previous, field));
    };

    const hasSelectedConditions = selectedFields.size > 0;
    const handleNext = () => void onNext(Array.from(selectedFields));
    const footerStyle = { paddingBottom: bottom };

    return (
        <View className="flex-1">
            <ScrollView
                testID={SuggestRuleSelectors.Modal}
                className="flex-1"
                contentContainerClassName="px-xl pt-4xl pb-xl gap-y-lg"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-primary font-medium text-xl">
                    <Trans>Quick rule</Trans>
                </Text>
                <SuggestRuleConditionSelector
                    availableFields={availableFields}
                    selectedFields={selectedFields}
                    onToggle={toggleField}
                    suggestRuleData={suggestRuleData}
                />
                <SuggestRuleDescription
                    hasSelectedConditions={hasSelectedConditions}
                    selectedFields={selectedFields}
                    suggestRuleData={suggestRuleData}
                    category={category ?? null}
                    tags={tags ?? null}
                />
            </ScrollView>

            <View className="px-xl pb-xl" style={footerStyle}>
                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={onDismiss} content={t`Cancel`} />
                    <Button className="flex-1" variant="cta" onPress={handleNext} disabled={!hasSelectedConditions} content={t`Next`} />
                </View>
            </View>
        </View>
    );
};
