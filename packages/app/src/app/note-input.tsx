import { TRANSACTION_COMMENT_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { PillButton } from '../@generic/component/pill-button/pill-button';
import { SheetTitle } from '../@generic/component/sheet-title/sheet-title';
import { TextArea } from '../@generic/component/textarea/text-area';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { logAndContinue } from '../@generic/utils/log-and-continue.util';
import { useSetting } from '../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../settings/mutation/update-settings.mutation';
import { useNoteInputModal, useNoteInputModalParams } from '../transaction/context/note-input-modal.context';

import { NoteInputModalSelector } from './note-input-modal.selector';

export default function NoteInputModal() {
    const { t } = useLingui();
    const [, resolveNoteInput, dismissNoteInput] = useNoteInputModal();
    useModalDismiss(dismissNoteInput);
    const currentParams = useNoteInputModalParams();
    const isAiEnabled = useSetting('isAiEnabled');
    const isAiNoteHintShown = useSetting('isAiNoteHintShown');

    const initialValue = currentParams?.initialValue ?? '';
    const valueRef = useRef(initialValue);

    const handleChangeText = (text: string) => {
        valueRef.current = text;
    };

    const showAiNoteHint = () => {
        appRuntime.runFork(logAndContinue(updateSettingsMutation({ isAiNoteHintShown: true })));
        Toast.show({
            type: 'info',
            text1: t`Budgie can sort notes on this phone`,
            text2: t`Turn on On-device AI in Settings. Tap to see what it downloads.`,
            onPress: () => {
                Toast.hide();
                router.push('/settings/ai');
            }
        });
    };

    const handleSubmit = () => {
        const shouldShowAiNoteHint = !isAiEnabled && !isAiNoteHintShown && isNotEmptyString(valueRef.current.trim());

        resolveNoteInput(valueRef.current);

        if (shouldShowAiNoteHint) {
            showAiNoteHint();
        }
    };

    return (
        <View className="bg-sheet-surface pb-xl" collapsable={false}>
            <SheetTitle title={t`Note`} />

            <View className="px-xl gap-lg">
                <View className="bg-surface-row rounded-3xl">
                    <TextArea
                        defaultValue={initialValue}
                        onChangeText={handleChangeText}
                        placeholder={t`Add a note...`}
                        autoFocus
                        borderless
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        maxLength={TRANSACTION_COMMENT_MAX_LENGTH}
                        minLines={2}
                        maxLines={5}
                        accessibilityLabel={t`Note`}
                        testID={NoteInputModalSelector.Input}
                    />
                </View>

                <PillButton
                    label={t`Done`}
                    accessibilityLabel={t`Apply`}
                    onPress={handleSubmit}
                    testID={NoteInputModalSelector.SubmitButton}
                />
            </View>
        </View>
    );
}
