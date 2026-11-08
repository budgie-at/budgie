import { useState } from 'react';
import { View } from 'react-native';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { ConvertToTransferModalSelector } from '../../../app/convert-to-transfer-modal.selector';
import { ConvertToTransferStepEnum } from '../../enum/convert-to-transfer-step.enum';
import { ConvertTransferAccountStep } from '../convert-transfer-account-step/convert-transfer-account-step';
import { ConvertTransferForm } from '../convert-transfer-form/convert-transfer-form';

interface Props {
    readonly isSubmitting: boolean;
    readonly onSubmit: (onConverted: () => void) => void;
    readonly onDismiss: () => void;
}

export const ConvertToTransferModalContent = ({ isSubmitting, onSubmit, onDismiss }: Props) => {
    const [step, setStep] = useState(ConvertToTransferStepEnum.CONVERT);

    const handleShowAccounts = () => {
        setStep(ConvertToTransferStepEnum.ACCOUNT);
    };

    const handleShowConvert = () => {
        setStep(ConvertToTransferStepEnum.CONVERT);
    };

    const steps = {
        [ConvertToTransferStepEnum.CONVERT]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View collapsable={false} testID={ConvertToTransferModalSelector.Page}>
                    <ConvertTransferForm isSubmitting={isSubmitting} onSubmit={onSubmit} onAccountPress={handleShowAccounts} />
                </View>
            )
        },
        [ConvertToTransferStepEnum.ACCOUNT]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: <ConvertTransferAccountStep onBack={handleShowConvert} />
        }
    };

    return (
        <MorphingSheet
            steps={steps}
            activeStep={step}
            onDismiss={onDismiss}
            isContentDraggable={step === ConvertToTransferStepEnum.CONVERT}
        />
    );
};
