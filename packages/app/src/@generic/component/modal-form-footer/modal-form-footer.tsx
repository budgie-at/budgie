import { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { ModalFormCancelButton } from '../modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../modal-form-save-button/modal-form-save-button';

interface Props extends PropsWithChildren {
    readonly onCancel: () => void;
    readonly onSave: () => void;
    readonly isSaveDisabled: boolean;
    readonly saveTestID: string;
}

export const ModalFormFooter = ({ onCancel, onSave, isSaveDisabled, saveTestID, children }: Props) => (
    <View className="px-3xl pb-3xl gap-y-md pt-xl">
        {children}

        <View className="flex-row gap-x-md">
            <ModalFormCancelButton onPress={onCancel} />
            <ModalFormSaveButton onPress={onSave} disabled={isSaveDisabled} testID={saveTestID} />
        </View>
    </View>
);
