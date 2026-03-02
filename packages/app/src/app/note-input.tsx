import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { NoteInputSelectors } from '../@e2e/selectors/note-input.selector';
import { FormSheetSpacer } from '../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { HapticPressable } from '../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../@generic/component/icon/icon';
import { Input } from '../@generic/component/input/input';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useNoteInputModal } from '../transaction/context/note-input-modal.context';

export default function NoteInputModal() {
    const { t } = useLingui();
    const [, resolveNoteInput, currentParams] = useNoteInputModal();
    const { backgroundColor } = useFormsheetListStyles();
    const [value, setValue] = useState(currentParams?.initialValue ?? '');

    const containerStyle = { flex: 1, backgroundColor };

    const handleSubmit = () => {
        resolveNoteInput(value);
    };

    return (
        <View style={containerStyle}>
            <View className="flex-row items-center gap-md px-xl py-lg">
                <View className="flex-1">
                    <Input
                        value={value}
                        onChangeText={setValue}
                        placeholder={t`Add a note...`}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                        borderless
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        testID={NoteInputSelectors.Input}
                    />
                </View>

                <HapticPressable
                    onPress={handleSubmit}
                    accessibilityLabel={t`Apply`}
                    accessibilityRole="button"
                    className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white"
                    testID={NoteInputSelectors.SubmitButton}
                >
                    <Icon icon={UserIconNameEnum.Check} size={22} className="text-black" />
                </HapticPressable>
            </View>

            <FormSheetSpacer />
        </View>
    );
}
