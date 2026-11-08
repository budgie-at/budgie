import { useState } from 'react';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { TransactionFeeStepEnum } from '../../enum/transaction-fee-step.enum';
import { useTransactionFeeSteps } from '../../hook/use-transaction-fee-steps.hook';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
    readonly onConfirm: (result: TransactionFeeModalResult) => void;
    readonly onDismiss: () => void;
}

export const TransactionFeeModalContent = ({ accountId, currencySymbol, entry, variant, onConfirm, onDismiss }: Props) => {
    const [step, setStep] = useState(TransactionFeeStepEnum.FEE);

    const handleShowFee = () => {
        setStep(TransactionFeeStepEnum.FEE);
    };

    const handleShowCategory = () => {
        setStep(TransactionFeeStepEnum.CATEGORY);
    };

    const handleShowCreate = () => {
        setStep(TransactionFeeStepEnum.CREATE_CATEGORY);
    };

    const { steps: feeSteps } = useTransactionFeeSteps({
        accountId,
        currencySymbol,
        entry,
        variant,
        isFeeActive: step === TransactionFeeStepEnum.FEE,
        shouldFocusOnMount: true,
        onConfirm,
        onShowFee: handleShowFee,
        onShowCategory: handleShowCategory,
        onShowCreate: handleShowCreate
    });

    const steps = {
        [TransactionFeeStepEnum.FEE]: feeSteps.fee,
        [TransactionFeeStepEnum.CATEGORY]: feeSteps.category,
        [TransactionFeeStepEnum.CREATE_CATEGORY]: feeSteps.createCategory
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={step === TransactionFeeStepEnum.FEE} />;
};
