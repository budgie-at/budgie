import { ReactNode } from 'react';
import { View } from 'react-native';

import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

interface Props {
    readonly onCancel: () => void;
    readonly onSubmit: () => void;
    readonly isSubmitting: boolean;
    readonly submitLabel?: string;
    readonly children?: ReactNode;
}

export const RuleFormButtons = ({ onCancel, onSubmit, isSubmitting, submitLabel, children }: Props) => (
    <View className="px-3xl pb-3xl gap-y-md pt-xl">
        {children}
        <View className="flex-row gap-x-md">
            <ModalFormCancelButton onPress={onCancel} />
            <ModalFormSaveButton
                testID={RuleFormSelector.SubmitButton}
                onPress={onSubmit}
                disabled={isSubmitting}
                content={submitLabel}
            />
        </View>
    </View>
);
