import { AccountTypeEnum, TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFormContext } from 'react-hook-form';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useConvertToTransferModalParams } from '../../hook/use-convert-to-transfer-modal-params.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { MeasuredTransferAccountPicker } from '../measured-transfer-account-picker/measured-transfer-account-picker';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';

interface Props {
    readonly edge: RoundedEdgeEnum;
}

export const ConvertTransferAccounts = ({ edge }: Props) => {
    const { t } = useLingui();
    const params = useConvertToTransferModalParams();
    const { setValue, clearErrors } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const { fromAccount, toAccount } = useTransferAccounts();
    const isExpense = params?.transactionType === TransactionTypeEnum.EXPENSE;
    const account = isExpense ? toAccount : fromAccount;
    const label = isExpense ? t`To account` : t`From account`;
    const testID = isExpense ? TransferQuickFormSelector.ToAccount : TransferQuickFormSelector.FromAccount;
    const selectedTestID = isExpense
        ? TransferQuickFormSelector.SelectedToAccount(account?.title ?? '')
        : TransferQuickFormSelector.SelectedFromAccount(account?.title ?? '');

    const handlePress = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector(
            {
                initialAccountId: account?.id,
                excludeAccountId: params?.excludeAccountId,
                excludeAccountTypes: [AccountTypeEnum.DEBT],
                onlyActive: false,
                origin
            },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    setValue(isExpense ? 'toAccountId' : 'fromAccountId', selectedAccountId);
                    clearErrors('root');
                }
            }
        );
    };

    return (
        <MeasuredTransferAccountPicker
            label={label}
            account={account}
            placeholder={
                <Text className="min-w-0 flex-1 text-[17px] leading-[22px] font-medium text-primary" maxFontSizeMultiplier={2}>
                    <Trans>Choose account</Trans>
                </Text>
            }
            testID={testID}
            selectedTestID={selectedTestID}
            edge={edge}
            onPress={handlePress}
        />
    );
};
