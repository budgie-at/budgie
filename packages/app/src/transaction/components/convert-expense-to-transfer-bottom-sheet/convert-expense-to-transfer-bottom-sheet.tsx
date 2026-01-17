import { UserIconNameEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { useConvertExpenseToTransferMutation } from '../../hooks/use-convert-expense-to-transfer.mutation';

const ConvertToTransferSchema = z.object({
    toAccountId: z.number().positive()
});

type ConvertToTransferForm = z.infer<typeof ConvertToTransferSchema>;

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly transactionId: number;
    readonly fromAccountId: number;
}

export const ConvertExpenseToTransferBottomSheet = (props: Props) => {
    const { ref, transactionId, fromAccountId } = props;

    const { t } = useLingui();

    const convertMutation = useConvertExpenseToTransferMutation();

    const form = useForm<ConvertToTransferForm>({
        resolver: zodResolver(ConvertToTransferSchema),
        mode: 'onChange'
    });

    const toAccountId = useWatch({ control: form.control, name: 'toAccountId' });

    const handleConvert = form.handleSubmit(async ({ toAccountId: accountId }) => {
        try {
            await convertMutation(transactionId, accountId);
        } catch {
            Toast.show({ type: 'error', text1: t`Conversion failed`, text2: t`Please try again` });
        }
    });

    const { isLoading, handleConfirm } = useConfirmAction(handleConvert, `/transactions/${transactionId}/transfer`);

    const handleSelect = (accountId: number) => void form.setValue('toAccountId', accountId, { shouldValidate: true });

    return (
        <ConfirmActionBottomSheet
            ref={ref}
            variant="default"
            icon={UserIconNameEnum.ArrowRightLeft}
            title={t`Convert to Transfer?`}
            description={t`Select the destination account for this transfer.`}
            buttonText={t`Convert to Transfer`}
            isDisabled={!form.formState.isValid}
            isLoading={isLoading}
            onSubmit={handleConfirm}
        >
            <AccountSelector
                accountId={toAccountId}
                excludeAccountId={fromAccountId}
                onSelect={handleSelect}
                variant="default"
                cardVariant="ghost"
            />
        </ConfirmActionBottomSheet>
    );
};
