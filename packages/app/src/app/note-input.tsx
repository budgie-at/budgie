import { TRANSACTION_COMMENT_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { View } from 'react-native';

import { Button } from '../@generic/component/button/button';
import { TextArea } from '../@generic/component/textarea/text-area';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useNoteInputModal } from '../transaction/context/note-input-modal.context';

import { NoteInputModalSelector } from './note-input-modal.selector';

export default function NoteInputModal() {
    const { t } = useLingui();
    const [, resolveNoteInput, currentParams] = useNoteInputModal();
    const { backgroundColor } = useFormsheetListStyles();

    const initialValue = currentParams?.initialValue ?? '';
    const valueRef = useRef(initialValue);

    const containerStyle = { flex: 1, backgroundColor };

    const handleChangeText = (text: string) => {
        valueRef.current = text;
    };

    const handleSubmit = () => {
        resolveNoteInput(valueRef.current);
    };

    return (
        <View style={containerStyle} collapsable={false}>
            <View collapsable={false} className="flex-row items-end gap-md px-xl py-lg">
                <View className="flex-1">
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
                        minLines={1}
                        maxLines={2}
                        testID={NoteInputModalSelector.Input}
                    />
                </View>

                <Button
                    onPress={handleSubmit}
                    accessible
                    accessibilityLabel={t`Apply`}
                    className="min-h-[48px] px-4xl"
                    content={t`Apply`}
                    size="sm"
                    testID={NoteInputModalSelector.SubmitButton}
                    variant="default"
                />
            </View>
        </View>
    );
}
