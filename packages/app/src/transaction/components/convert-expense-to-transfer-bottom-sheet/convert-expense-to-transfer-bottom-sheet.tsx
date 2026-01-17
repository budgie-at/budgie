import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useConvertExpenseToTransferMutation } from '../../hooks/use-convert-expense-to-transfer.mutation';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly transactionId: number;
    readonly fromAccountId: number;
    readonly onSuccess: () => void;
}

export const ConvertExpenseToTransferBottomSheet = (props: Props) => {
    const { ref, transactionId, fromAccountId, onSuccess } = props;

    const { t } = useLingui();

    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const convertMutation = useConvertExpenseToTransferMutation();

    const handleConvert = async () => {
        if (!isDefined(selectedAccountId)) {
            return;
        }
        setIsLoading(true);
        try {
            await convertMutation(transactionId, selectedAccountId);
            onSuccess();
            ref.current?.close();
        } catch {
            Toast.show({ type: 'error', text1: t`Conversion failed`, text2: t`Please try again` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ConfirmActionBottomSheet
            ref={ref}
            variant="default"
            icon={UserIconNameEnum.ArrowRightLeft}
            title={t`Convert to Transfer?`}
            description={t`Select the destination account for this transfer.`}
            buttonText={t`Convert to Transfer`}
            isDisabled={!isDefined(selectedAccountId)}
            isLoading={isLoading}
            onSubmit={handleConvert}
        >
            <AccountSelector
                accountId={selectedAccountId}
                excludeAccountId={fromAccountId}
                onSelect={setSelectedAccountId}
                variant="default"
                cardVariant="ghost"
            />
        </ConfirmActionBottomSheet>
    );
};
