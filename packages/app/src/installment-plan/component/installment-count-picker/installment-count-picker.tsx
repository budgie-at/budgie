import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { KeyboardDoneAccessory } from '../../../@generic/component/keyboard-done-accessory/keyboard-done-accessory';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { MAX_INSTALLMENT_COUNT, MIN_INSTALLMENT_COUNT } from '../../constant/convert-to-installment-form-schema.constant';
import { useInstallmentCountDraft } from '../../hook/use-installment-count-draft.hook';
import { InstallmentCountChips } from '../installment-count-chips/installment-count-chips';
import { InstallmentCountStepButton } from '../installment-count-step-button/installment-count-step-button';

interface Props {
    readonly selectedCount: number;
    readonly minimumCount?: number;
    readonly onSelect: (count: number) => void;
}

export const InstallmentCountPicker = ({ selectedCount, minimumCount = MIN_INSTALLMENT_COUNT, onSelect }: Props) => {
    const { t } = useLingui();
    const inputRef = useRef<TextInput>(null);
    const lowestCount = Math.max(minimumCount, MIN_INSTALLMENT_COUNT);
    const { draft, notice, isDraftValid, commit, handleChangeText, handleFocus, handleBlur } = useInstallmentCountDraft(
        selectedCount,
        lowestCount,
        onSelect
    );

    const handleFocusInput = () => {
        inputRef.current?.focus();
    };

    const handleSelect = (count: number) => {
        commit(String(count));
        Keyboard.dismiss();
    };

    const caption = isDraftValid ? notice : t`${lowestCount}–${MAX_INSTALLMENT_COUNT} months · showing ${selectedCount}`;
    const chipsSelectedCount = isDraftValid ? selectedCount : null;
    const unitLabel = t({ message: plural(Number(draft ?? selectedCount), { one: 'month', other: 'months' }) });

    return (
        <View className="gap-y-sm">
            <View className="min-h-14 flex-row items-center rounded-full bg-surface-fill p-sm">
                <InstallmentCountStepButton
                    icon={UserIconNameEnum.Minus}
                    count={selectedCount}
                    delta={-1}
                    minimumCount={lowestCount}
                    accessibilityLabel={t`Fewer months`}
                    onSelect={handleSelect}
                    testID={ConvertToInstallmentModalSelector.CountDecrement}
                />
                <Pressable
                    className="flex-1 flex-row flex-wrap content-center items-center justify-center gap-x-xs self-stretch"
                    onPress={handleFocusInput}
                    accessible={false}
                >
                    <TextInput
                        ref={inputRef}
                        value={draft ?? String(selectedCount)}
                        onChangeText={handleChangeText}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        keyboardType="number-pad"
                        maxLength={3}
                        selectTextOnFocus
                        textAlign="right"
                        inputAccessoryViewID={ConvertToInstallmentModalSelector.CountKeyboardDone}
                        className="h-auto min-h-[44px] min-w-[44px] px-0 py-0 text-(length:--text-xl) font-semibold text-primary tabular-nums"
                        accessibilityLabel={t`Number of months`}
                        accessibilityHint={t`Between ${lowestCount} and ${MAX_INSTALLMENT_COUNT} months`}
                        testID={ConvertToInstallmentModalSelector.CountInput}
                    />
                    <Text
                        className="text-xl text-secondary-foreground"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        {unitLabel}
                    </Text>
                </Pressable>
                <InstallmentCountStepButton
                    icon={UserIconNameEnum.Plus}
                    count={selectedCount}
                    delta={1}
                    minimumCount={lowestCount}
                    accessibilityLabel={t`More months`}
                    onSelect={handleSelect}
                    testID={ConvertToInstallmentModalSelector.CountIncrement}
                />
            </View>
            {isDefined(caption) ? (
                <Text className="text-center text-sm text-secondary-foreground tabular-nums" accessibilityLiveRegion="polite">
                    {caption}
                </Text>
            ) : null}
            <InstallmentCountChips selectedCount={chipsSelectedCount} minimumCount={lowestCount} onSelect={handleSelect} />
            <KeyboardDoneAccessory nativeID={ConvertToInstallmentModalSelector.CountKeyboardDone} />
        </View>
    );
};
