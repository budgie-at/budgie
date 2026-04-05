import { ReactNode } from 'react';
import { View } from 'react-native';

import { RuleFormSelectors } from '../../../@e2e/selectors/rule-form.selector';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';

interface Props {
    readonly onCancel: () => void;
    readonly onSubmit: () => void;
    readonly isSubmitting: boolean;
    readonly children?: ReactNode;
}

export const RuleFormButtons = ({ onCancel, onSubmit, isSubmitting, children }: Props) => (
    <View className="px-3xl pb-3xl gap-y-md pt-xl">
        {children}
        <View className="flex-row gap-x-md">
            <ModalFormCancelButton onPress={onCancel} />
            <ModalFormSaveButton testID={RuleFormSelectors.SubmitButton} onPress={onSubmit} disabled={isSubmitting} />
        </View>
    </View>
);
