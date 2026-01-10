import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Ref } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { Button } from '../../../@generic/component/button/button';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSuggestRuleBottomSheet } from '../../hooks/use-suggest-rule-bottom-sheet.hook';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { SuggestRuleConditionSelector } from '../suggest-rule-condition-selector/suggest-rule-condition-selector';
import { SuggestRuleDescription } from '../suggest-rule-description/suggest-rule-description';

interface Props {
    readonly ref: Ref<BottomSheetInterface<SuggestRuleDataInterface> | null>;
    readonly onRuleCreated?: () => void;
}

export const SuggestRuleBottomSheet = ({ ref, onRuleCreated }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const {
        modalRef,
        data,
        selectedFields,
        toggleField,
        applyToExisting,
        setApplyToExisting,
        isCreating,
        close,
        handleCreateRule,
        handleConfigureRule,
        hasComment,
        hasMccCode,
        hasSelectedFields
    } = useSuggestRuleBottomSheet({ ref, onRuleCreated });
    const contentContainerStyle = { paddingBottom: bottom + 16 };
    const handleApplyToExistingChange = (value: boolean) => void setApplyToExisting(value);
    const isSubmitDisabled = isCreating || !hasSelectedFields;

    return (
        <BottomSheet ref={modalRef} enableDynamicSizing>
            <BottomSheetScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contentContainerStyle}
            >
                <View className="px-5xl">
                    <BottomSheetHeader
                        size="lg"
                        align="center"
                        title={t`Create Rule?`}
                    />

                    <SuggestRuleConditionSelector
                        data={data}
                        selectedFields={selectedFields}
                        onToggleField={toggleField}
                        hasComment={hasComment}
                        hasMccCode={hasMccCode}
                    />

                    {isDefined(data) ? <SuggestRuleDescription data={data} selectedFields={selectedFields} /> : null}

                    <View className="flex-row items-center justify-between mt-3xl py-md">
                        <Text className="text-base text-primary">
                            <Trans>Apply to existing transactions</Trans>
                        </Text>
                        <ThemedSwitch value={applyToExisting} onValueChange={handleApplyToExistingChange} />
                    </View>

                    <View className="gap-y-md mt-3xl">
                        <Button content={t`Create Rule`} onPress={handleCreateRule} variant="ghost" size="md" leftIcon={UserIconNameEnum.Sparkles} disabled={isSubmitDisabled} />
                        <Button content={t`Configure Rule`} onPress={handleConfigureRule} variant="secondary" size="md" leftIcon={UserIconNameEnum.Settings} disabled={isSubmitDisabled} />
                        <Button content={t`No thanks`} onPress={close} variant="secondary" size="md" disabled={isCreating} />
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
