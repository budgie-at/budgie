import { AccountTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { AccountSelectorSheetContent } from '../../../account/component/account-selector-sheet-content/account-selector-sheet-content';
import { useConvertToTransferModalParams } from '../../hook/use-convert-to-transfer-modal-params.hook';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';

import type { AccountSelectorResult } from '../../../account/context/account-selector-modal.context';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly onBack: () => void;
}

export const ConvertTransferAccountStep = ({ onBack }: Props) => {
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const params = useConvertToTransferModalParams();
    const { setValue, clearErrors } = useFormContext<TransactionCreateInputInterface>();
    const { fromAccount, toAccount } = useTransferAccounts();
    const isExpense = params?.transactionType === TransactionTypeEnum.EXPENSE;
    const account = isExpense ? toAccount : fromAccount;

    const selectorParams = {
        initialAccountId: account?.id,
        excludeAccountId: params?.excludeAccountId,
        excludeAccountTypes: [AccountTypeEnum.DEBT],
        onlyActive: false
    };

    const handleSelect = (accountId: AccountSelectorResult) => {
        if (isDefined(accountId)) {
            setValue(isExpense ? 'toAccountId' : 'fromAccountId', accountId);
            clearErrors('root');
        }

        onBack();
    };

    return (
        <View style={listStyle}>
            <AccountSelectorSheetContent params={selectorParams} onSelect={handleSelect} onBack={onBack} />
        </View>
    );
};
