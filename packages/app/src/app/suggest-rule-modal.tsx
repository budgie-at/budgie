import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../@e2e/selectors/suggest-rule.selector';
import { Button } from '../@generic/component/button/button';
import { ModalPage } from '../@generic/component/page/modal-page';
import { PageHeader } from '../@generic/component/page-header/page-header';
import { ThemedSwitch } from '../@generic/component/themed-switch/themed-switch';
import { SuggestRuleConditionSelector } from '../rule/components/suggest-rule-condition-selector/suggest-rule-condition-selector';
import { SuggestRuleDescription } from '../rule/components/suggest-rule-description/suggest-rule-description';
import { useRuleFormModal } from '../rule/context/rule-form-modal.context';
import { useSuggestRuleModalLogic } from '../rule/hooks/use-suggest-rule-modal.hook';
import { buildRuleInputFromPrefill } from '../rule/util/build-rule-input-from-prefill.util';

export default function SuggestRuleModal() {
    const { t } = useLingui();
    const { openRuleForm } = useRuleFormModal();
    const {
        data,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        handleCancel,
        handleCreateRule,
        getPrefillData,
        hasComment,
        hasMccCode,
        hasSelectedFields
    } = useSuggestRuleModalLogic();

    const isSubmitDisabled = isCreating || !hasSelectedFields;

    const handleConfigureRule = async () => {
        const prefillData = getPrefillData();
        if (!isDefined(prefillData)) {
            return;
        }

        handleCancel();
        await openRuleForm({ input: buildRuleInputFromPrefill(prefillData) });
    };

    return (
        <ModalPage testID={SuggestRuleSelectors.Modal} header={<PageHeader title={t`Create Rule?`} onGoBack={handleCancel} />}>
            <View className="flex-1">
                <SuggestRuleConditionSelector
                    data={data}
                    selectedFields={selectedFields}
                    onToggleField={toggleField}
                    hasComment={hasComment}
                    hasMccCode={hasMccCode}
                />

                {isDefined(data) ? <SuggestRuleDescription data={data} selectedFields={selectedFields} /> : null}

                <View className="flex-row items-center justify-between mt-3xl py-md mb-auto">
                    <Text className="text-base text-primary">
                        <Trans>Apply to existing transactions</Trans>
                    </Text>
                    <ThemedSwitch
                        value={applyToExisting}
                        onValueChange={setApplyToExisting}
                        testID={SuggestRuleSelectors.ApplyToExistingToggle}
                    />
                </View>

                <View className="gap-y-md mt-3xl">
                    <Button
                        content={t`Create Rule`}
                        onPress={handleCreateRule}
                        variant="ghost"
                        size="md"
                        leftIcon={UserIconNameEnum.Sparkles}
                        disabled={isSubmitDisabled}
                        testID={SuggestRuleSelectors.CreateRuleButton}
                    />
                    <Button
                        content={t`Configure Rule`}
                        onPress={handleConfigureRule}
                        variant="secondary"
                        size="md"
                        leftIcon={UserIconNameEnum.Settings}
                        disabled={isSubmitDisabled}
                        testID={SuggestRuleSelectors.ConfigureRuleButton}
                    />
                    <Button
                        content={t`No thanks`}
                        onPress={handleCancel}
                        variant="secondary"
                        size="md"
                        disabled={isCreating}
                        testID={SuggestRuleSelectors.NoThanksButton}
                    />
                </View>
            </View>
        </ModalPage>
    );
}
