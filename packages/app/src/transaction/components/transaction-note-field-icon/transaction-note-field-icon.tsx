import { TransactionCreateInputInterface, TRANSACTION_COMMENT_MAX_LENGTH, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Keyboard, TextInput, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SheetHeaderAction } from '../../../@generic/component/sheet-header-action/sheet-header-action';
import { NoteInputModalSelector } from '../../../app/note-input-modal.selector';
import { TRANSACTION_NOTE_INPUT_MIN_HEIGHT } from '../../constant/transaction-note-input-min-height.constant';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

export const TransactionNoteFieldIcon = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const comment = useWatch({ control, name: 'comment' });
    const [editing, setEditing] = useState(false);
    const inputStyle = { minHeight: TRANSACTION_NOTE_INPUT_MIN_HEIGHT };
    const noteValue = isNotEmptyString(comment) ? comment : void 0;
    const handlePress = () => void setEditing(true);
    const handleChange = (value: string) => void setValue('comment', value, { shouldDirty: true });
    const handleDone = () => {
        Keyboard.dismiss();
        setEditing(false);
    };

    return (
        <View>
            <TransactionFieldIcon
                icon={UserIconNameEnum.MessageSquare}
                label={t`Note`}
                value={noteValue}
                placeholder={t`Add`}
                onPress={handlePress}
                testID={SimpleQuickFormSelector.CommentInput}
            />
            {editing ? (
                <View className="gap-md px-xl pb-xl">
                    <View className="items-end">
                        <SheetHeaderAction label={t`Done`} testID={NoteInputModalSelector.SubmitButton} onPress={handleDone} />
                    </View>
                    <TextInput
                        value={comment}
                        onChangeText={handleChange}
                        multiline
                        scrollEnabled={false}
                        autoFocus
                        maxLength={TRANSACTION_COMMENT_MAX_LENGTH}
                        accessibilityLabel={t`Note`}
                        placeholder={t`Add a note...`}
                        placeholderTextColorClassName="accent-secondary-foreground"
                        style={inputStyle}
                        className="rounded-xl bg-surface-fill p-xl text-[17px] text-primary"
                        testID={NoteInputModalSelector.Input}
                    />
                </View>
            ) : null}
        </View>
    );
};
