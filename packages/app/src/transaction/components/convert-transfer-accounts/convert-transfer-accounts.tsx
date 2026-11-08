import { TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useConvertToTransferModalParams } from '../../hook/use-convert-to-transfer-modal-params.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

interface Props {
    readonly onPress: () => void;
}

export const ConvertTransferAccounts = ({ onPress }: Props) => {
    const { t } = useLingui();
    const params = useConvertToTransferModalParams();
    const { fromAccount, toAccount } = useTransferAccounts();
    const isExpense = params?.transactionType === TransactionTypeEnum.EXPENSE;
    const account = isExpense ? toAccount : fromAccount;
    const label = isExpense ? t`To account` : t`From account`;
    const testID = isExpense ? TransferQuickFormSelector.ToAccount : TransferQuickFormSelector.FromAccount;
    const selectedTestID = isExpense
        ? TransferQuickFormSelector.SelectedToAccount(account?.title ?? '')
        : TransferQuickFormSelector.SelectedFromAccount(account?.title ?? '');

    return (
        <TransferAccountPicker
            label={label}
            account={account}
            placeholder={
                <Text className="min-w-0 flex-1 text-[17px] leading-[22px] font-medium text-primary" maxFontSizeMultiplier={2}>
                    <Trans>Choose account</Trans>
                </Text>
            }
            testID={testID}
            selectedTestID={selectedTestID}
            onPress={onPress}
        />
    );
};
