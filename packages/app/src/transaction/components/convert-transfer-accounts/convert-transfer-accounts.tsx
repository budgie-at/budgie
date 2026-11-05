import { AccountTypeEnum, TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useConvertToTransferModalParams } from '../../context/convert-to-transfer-modal.context';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { QuickFormFieldError } from '../quick-form-field-error/quick-form-field-error';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

const ACCOUNT_FIELDS = ['fromAccountId', 'toAccountId'] as const;

export const ConvertTransferAccounts = () => {
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

    const handlePress = () => {
        openAccountSelector(
            {
                initialAccountId: account?.id,
                excludeAccountId: params?.excludeAccountId,
                excludeAccountTypes: [AccountTypeEnum.DEBT],
                onlyActive: false
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
        <GroupedListSection footer={<QuickFormFieldError fields={ACCOUNT_FIELDS} />}>
            <TransferAccountPicker
                label={label}
                account={account}
                placeholder={t`Choose account`}
                testID={testID}
                selectedTestID={selectedTestID}
                onPress={handlePress}
            />
        </GroupedListSection>
    );
};
