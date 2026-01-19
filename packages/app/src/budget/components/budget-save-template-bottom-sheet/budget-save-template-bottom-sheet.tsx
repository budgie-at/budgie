import { BUDGET_TEMPLATE_NAME_MAX_LENGTH, BudgetEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { BottomSheetTextInput } from '../../../@generic/component/bottom-sheet-text-input/bottom-sheet-text-input';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { budgetTemplateService } from '../../service/budget-template.service';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly budget: BudgetEntityInterface;
    readonly onSuccess?: () => void;
}

export const BudgetSaveTemplateBottomSheet = (props: Props) => {
    const { ref, budget, onSuccess } = props;

    const { t } = useLingui();

    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleDismiss = () => {
        setName('');
        setErrorMessage(null);
    };

    const handleCancel = () => {
        handleDismiss();
        void ref.current?.close();
    };

    const handleSave = async () => {
        const trimmedName = name.trim();

        if (!isNotEmptyString(trimmedName)) {
            setErrorMessage(t`Template name is required`);

            return;
        }

        if (trimmedName.length > BUDGET_TEMPLATE_NAME_MAX_LENGTH) {
            setErrorMessage(t`Template name must be ${BUDGET_TEMPLATE_NAME_MAX_LENGTH} characters or less`);

            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const isNameTaken = await budgetTemplateService.isNameTaken(trimmedName);

            if (isNameTaken) {
                setErrorMessage(t`A template with this name already exists`);
                setIsSubmitting(false);

                return;
            }

            await budgetTemplateService.createFromBudget(budget, trimmedName);
            void ref.current?.close();
            handleDismiss();
            onSuccess?.();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to save template` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStatus = isNotEmptyString(errorMessage) ? 'error' : 'default';

    return (
        <BottomSheet enableDynamicSizing onDismiss={handleDismiss} ref={ref}>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-7xl py-5xl">
                    <View className="mb-10">
                        <BottomSheetHeader size="lg" align="center" title={t`Save as Template`} />
                    </View>

                    <BottomSheetTextInput
                        value={name}
                        onChangeText={setName}
                        placeholder={t`Enter template name`}
                        autoFocus
                        size="lg"
                        status={inputStatus}
                        maxLength={BUDGET_TEMPLATE_NAME_MAX_LENGTH}
                    />

                    {isNotEmptyString(errorMessage) ? (
                        <Text className="text-destructive-foreground text-sm mt-sm text-center">{errorMessage}</Text>
                    ) : null}
                </View>

                <BottomSheetFormFooter
                    onCancel={handleCancel}
                    onSubmit={handleSave}
                    submitLabel={t`Save`}
                    submitDisabled={isSubmitting || !isNotEmptyString(name.trim())}
                />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
