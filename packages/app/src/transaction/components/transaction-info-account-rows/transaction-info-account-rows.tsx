import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { getAccountIbanSuffix } from '../../utils/get-account-iban-suffix.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoAccountRows = ({ transaction }: Props) => {
    const { t } = useLingui();
    const account = transaction.type === TransactionTypeEnum.INCOME ? transaction.toAccount : transaction.fromAccount;
    const isTransfer = transaction.type === TransactionTypeEnum.TRANSFER;
    const showFromAccount = isTransfer && isDefined(transaction.fromAccount);
    const showToAccount = isTransfer && isDefined(transaction.toAccount);
    const showAccount = !isTransfer && isDefined(account);

    return (
        <>
            {showFromAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`From account`}
                    value={transaction.fromAccount.title}
                    description={getAccountIbanSuffix(transaction.fromAccount)}
                    testID={TransactionInfoPageSelector.Row.FromAccount}
                />
            ) : null}

            {showToAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.CreditCard}
                    label={t`To account`}
                    value={transaction.toAccount.title}
                    description={getAccountIbanSuffix(transaction.toAccount)}
                    testID={TransactionInfoPageSelector.Row.ToAccount}
                />
            ) : null}

            {showAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`Account`}
                    value={account.title}
                    description={getAccountIbanSuffix(account)}
                    testID={TransactionInfoPageSelector.Row.Account}
                />
            ) : null}
        </>
    );
};
