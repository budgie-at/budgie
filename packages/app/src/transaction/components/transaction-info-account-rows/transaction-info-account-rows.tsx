import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionInfoAccountRowsPropsInterface } from '../../interface/transaction-info-account-rows-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const getPrimaryAccount = (transaction: TransactionWithRelationsEntityInterface) => {
    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.toAccount;
    }

    return transaction.fromAccount;
};

const getAccountDescription = (account: ReturnType<typeof getPrimaryAccount>): string | null => {
    if (!isDefined(account?.iban)) {
        return null;
    }

    return `... ${account.iban.slice(-4)}`;
};

export const TransactionInfoAccountRows = ({ transaction }: TransactionInfoAccountRowsPropsInterface) => {
    const { t } = useLingui();
    const { formatDayAndFullMonthAndYear, formatMonthAndDayWithTime } = useFormatDate();
    const account = getPrimaryAccount(transaction);
    const isTransfer = transaction.type === TransactionTypeEnum.TRANSFER;

    return (
        <>
            <TransactionInfoRow
                icon={UserIconNameEnum.Calendar}
                label={t`Date`}
                value={formatDayAndFullMonthAndYear(transaction.operatedAt)}
                description={formatMonthAndDayWithTime(transaction.operatedAt)}
                testID={TransactionInfoPageSelector.Row.Date}
            />

            {isTransfer && isDefined(transaction.fromAccount) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`From account`}
                    value={transaction.fromAccount.title}
                    description={getAccountDescription(transaction.fromAccount)}
                    testID={TransactionInfoPageSelector.Row.FromAccount}
                />
            ) : null}

            {isTransfer && isDefined(transaction.toAccount) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.CreditCard}
                    label={t`To account`}
                    value={transaction.toAccount.title}
                    description={getAccountDescription(transaction.toAccount)}
                    testID={TransactionInfoPageSelector.Row.ToAccount}
                />
            ) : null}

            {!isTransfer && isDefined(account) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`Account`}
                    value={account.title}
                    description={getAccountDescription(account)}
                    testID={TransactionInfoPageSelector.Row.Account}
                />
            ) : null}
        </>
    );
};
