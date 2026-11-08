import { TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { ConvertToTransferModalSelector } from '../../../app/convert-to-transfer-modal.selector';
import { ConvertToTransferStepEnum } from '../../enum/convert-to-transfer-step.enum';
import { useApplyTransactionFeeResult } from '../../hook/use-apply-transaction-fee-result.hook';
import { useTransactionFeeSteps } from '../../hook/use-transaction-fee-steps.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { ConvertTransferAccountStep } from '../convert-transfer-account-step/convert-transfer-account-step';
import { ConvertTransferForm } from '../convert-transfer-form/convert-transfer-form';

import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly isSubmitting: boolean;
    readonly onSubmit: (onConverted: () => void) => void;
    readonly onDismiss: () => void;
}

export const ConvertToTransferModalContent = ({ isSubmitting, onSubmit, onDismiss }: Props) => {
    const [step, setStep] = useState(ConvertToTransferStepEnum.CONVERT);
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const entries = useWatch({ control, name: 'entries' });
    const { fromAccountId, fromAccount } = useTransferAccounts();
    const applyFeeResult = useApplyTransactionFeeResult(TransactionTypeEnum.TRANSFER);

    const handleShowConvert = () => {
        setStep(ConvertToTransferStepEnum.CONVERT);
    };

    const handleShowAccounts = () => {
        setStep(ConvertToTransferStepEnum.ACCOUNT);
    };

    const handleShowFee = () => {
        setStep(ConvertToTransferStepEnum.FEE);
    };

    const handleShowFeeCategory = () => {
        setStep(ConvertToTransferStepEnum.FEE_CATEGORY);
    };

    const handleShowFeeCreate = () => {
        setStep(ConvertToTransferStepEnum.FEE_CREATE_CATEGORY);
    };

    const handleFeeConfirm = (result: TransactionFeeModalResult) => {
        applyFeeResult(result, fromAccountId ?? 0);
    };

    const { steps: feeSteps, handleOpenFee } = useTransactionFeeSteps({
        accountId: fromAccountId ?? 0,
        currencySymbol: fromAccount?.instrument.symbol ?? '',
        entry: getTransactionFeeEntries(entries).at(0) ?? null,
        variant: 'default',
        isFeeActive: step === ConvertToTransferStepEnum.FEE,
        shouldFocusOnMount: false,
        onConfirm: handleFeeConfirm,
        onShowFee: handleShowFee,
        onShowCategory: handleShowFeeCategory,
        onShowCreate: handleShowFeeCreate,
        onDone: handleShowConvert
    });

    const steps = {
        [ConvertToTransferStepEnum.CONVERT]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View collapsable={false} testID={ConvertToTransferModalSelector.Page}>
                    <ConvertTransferForm
                        isSubmitting={isSubmitting}
                        onSubmit={onSubmit}
                        onAccountPress={handleShowAccounts}
                        onFeePress={handleOpenFee}
                    />
                </View>
            )
        },
        [ConvertToTransferStepEnum.ACCOUNT]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            onBack: handleShowConvert,
            content: <ConvertTransferAccountStep onBack={handleShowConvert} />
        },
        [ConvertToTransferStepEnum.FEE]: feeSteps.fee,
        [ConvertToTransferStepEnum.FEE_CATEGORY]: feeSteps.category,
        [ConvertToTransferStepEnum.FEE_CREATE_CATEGORY]: feeSteps.createCategory
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} />;
};
