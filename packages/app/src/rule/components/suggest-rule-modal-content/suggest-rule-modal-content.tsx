import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { Button } from '../../../@generic/component/button/button';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useSuggestRuleModalHook } from '../../hooks/use-suggest-rule-modal.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { SuggestRuleActionPills } from '../suggest-rule-action-pills/suggest-rule-action-pills';
import { SuggestRuleConditionSelector } from '../suggest-rule-condition-selector/suggest-rule-condition-selector';
import { SuggestRuleDescription } from '../suggest-rule-description/suggest-rule-description';

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onCreateRule: () => void;
    readonly onDismiss: () => void;
}

// eslint-disable-next-line max-lines-per-function -- Modal component with multiple sections and computed values
export const SuggestRuleModalContent = ({ suggestRuleData, onCreateRule, onDismiss }: Props) => {
    const {
        availableFields,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        isBusy,
        isApplying,
        progress,
        hasSelectedConditions,
        matchingCount,
        isCountLoading,
        handleCreateRule,
        handleDismiss
    } = useSuggestRuleModalHook({ suggestRuleData, onCreateRule, onDismiss });

    const { category } = useGetCategoryByIdQuery(suggestRuleData.categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(suggestRuleData.tagIds);

    const handleCreate = () => void handleCreateRule();
    const isCreateDisabled = !hasSelectedConditions || isBusy;
    const displayMatchingCount = matchingCount ?? 0;
    const processed = progress?.processed ?? 0;
    const total = progress?.total ?? 0;
    const buttonText = applyToExisting ? t`Create & update` : t`Create Rule`;
    const progressText = isDefined(progress) ? t`Updating ${processed}/${total}...` : buttonText;
    const createButtonContent = isApplying ? progressText : buttonText;
    const showCreateLoading = isCreating && !isApplying;

    return (
        <ModalPage header={<PageHeader title={t`Create Automation Rule`} {...(!isBusy && { onGoBack: handleDismiss })} />}>
            <KeyboardAwareScrollView
                testID={SuggestRuleSelectors.Modal}
                contentContainerClassName="pb-3xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
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

                    <SuggestRuleActionPills category={category ?? null} tags={tags ?? null} />

                    {hasSelectedConditions ? (
                        <View className="flex-row items-center justify-between gap-x-lg">
                            <View className="flex-1 flex-row items-center gap-x-sm">
                                {isCountLoading ? (
                                    <>
                                        <ActivityIndicator size="small" />
                                        <Text className="text-sm text-secondary-foreground">
                                            <Trans>Checking transactions...</Trans>
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-sm text-primary">
                                        <Trans>{displayMatchingCount} matching transactions — update them too?</Trans>
                                    </Text>
                                )}
                            </View>
                            <ThemedSwitch
                                testID={SuggestRuleSelectors.ApplyToExistingToggle}
                                value={applyToExisting}
                                onValueChange={setApplyToExisting}
                            />
                        </View>
                    ) : null}
                </View>
            </KeyboardAwareScrollView>

            <View className="px-3xl pb-3xl gap-y-md pt-xl">
                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={handleDismiss} disabled={isBusy} content={t`Cancel`} />
                    <Button
                        testID={SuggestRuleSelectors.CreateRuleButton}
                        className="flex-1"
                        content={createButtonContent}
                        variant="cta"
                        onPress={handleCreate}
                        disabled={isCreateDisabled}
                        isLoading={showCreateLoading}
                    />
                </View>
            </View>
        </ModalPage>
    );
};
