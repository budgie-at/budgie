import { TransactionTypeEnum } from '@budgie/contracts';

import { ConvertToTransferForm } from '../transaction/components/convert-to-transfer-form/convert-to-transfer-form';
import { useConvertToTransferModal } from '../transaction/context/convert-to-transfer-modal.context';

export default function ConvertToTransferModal() {
    const { currentParams, resolveConvertToTransfer } = useConvertToTransferModal();

    const handleSuccess = () => {
        resolveConvertToTransfer(true);
    };

    const handleCancel = () => {
        resolveConvertToTransfer(false);
    };

    return (
        <ConvertToTransferForm
            transactionId={currentParams?.transactionId ?? 0}
            transactionType={currentParams?.transactionType ?? TransactionTypeEnum.EXPENSE}
            excludeAccountId={currentParams?.excludeAccountId ?? 0}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
