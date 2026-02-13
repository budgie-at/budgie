import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { Button } from '../../../@generic/component/button/button';
import { FormSheetSpacer } from '../../../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useSuggestRuleBottomSheet } from '../../hooks/use-suggest-rule-bottom-sheet.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { SuggestRuleConditionSelector } from '../suggest-rule-condition-selector/suggest-rule-condition-selector';
import { SuggestRuleDescription } from '../suggest-rule-description/suggest-rule-description';

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onCreateRule: () => void;
    readonly onDismiss: () => void;
}

export const SuggestRuleBottomSheet = ({ suggestRuleData, onCreateRule, onDismiss }: Props) => {
    const {
        availableFields,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        hasSelectedConditions,
        handleCreateRule,
        handleConfigureRule,
        handleDismiss
    } = useSuggestRuleBottomSheet({ suggestRuleData, onCreateRule, onDismiss });

    const { backgroundColor } = useFormsheetListStyles();
    const { category } = useGetCategoryByIdQuery(suggestRuleData.categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(suggestRuleData.tagIds);

    const handleCreate = () => void handleCreateRule();
    const isCreateDisabled = !hasSelectedConditions || isCreating;
    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View testID={SuggestRuleSelectors.BottomSheet} style={containerStyle}>
            <ScrollView contentContainerClassName="pb-3xl" showsVerticalScrollIndicator={false}>
                <BottomSheetHeader size="md" title={t`Create Automation Rule`} />

                <View className="px-3xl gap-y-3xl">
                    <View className="gap-y-lg">
                        <Text className="text-sm font-medium text-secondary-foreground">
                            <Trans>Match conditions</Trans>
                        </Text>
                        <SuggestRuleConditionSelector
                            availableFields={availableFields}
                            selectedFields={selectedFields}
                            onToggle={toggleField}
                            suggestRuleData={suggestRuleData}
                        />
                    </View>

                    <SuggestRuleDescription
                        hasSelectedConditions={hasSelectedConditions}
                        selectedFields={selectedFields}
                        suggestRuleData={suggestRuleData}
                        category={category ?? null}
                        tags={tags ?? null}
                    />

                    <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-primary">
                            <Trans>Apply to existing transactions</Trans>
                        </Text>
                        <ThemedSwitch
                            testID={SuggestRuleSelectors.ApplyToExistingToggle}
                            value={applyToExisting}
                            onValueChange={setApplyToExisting}
                        />
                    </View>

                    <View className="gap-y-md">
                        <Button
                            testID={SuggestRuleSelectors.CreateRuleButton}
                            content={t`Create Rule`}
                            variant="primary"
                            onPress={handleCreate}
                            disabled={isCreateDisabled}
                        />
                        <Button
                            testID={SuggestRuleSelectors.ConfigureRuleButton}
                            content={t`Configure Rule`}
                            variant="ghost"
                            onPress={handleConfigureRule}
                        />
                        <Button
                            testID={SuggestRuleSelectors.NoThanksButton}
                            content={t`No thanks`}
                            variant="secondary"
                            onPress={handleDismiss}
                        />
                    </View>
                </View>
            </ScrollView>
            <FormSheetSpacer />
        </View>
    );
};
