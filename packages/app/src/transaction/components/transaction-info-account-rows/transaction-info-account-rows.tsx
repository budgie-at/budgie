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

export const TransactionInfoAccountRows = ({ transaction, hasFollowingRows }: TransactionInfoAccountRowsPropsInterface) => {
    const { t } = useLingui();
    const { formatDayAndFullMonthAndYear, formatWeekdayWithTime } = useFormatDate();
    const account = getPrimaryAccount(transaction);
    const isTransfer = transaction.type === TransactionTypeEnum.TRANSFER;
    const showFromAccount = isTransfer && isDefined(transaction.fromAccount);
    const showToAccount = isTransfer && isDefined(transaction.toAccount);
    const showAccount = !isTransfer && isDefined(account);
    const dateWithBottomBorder = showFromAccount || showToAccount || showAccount || hasFollowingRows;
    const fromAccountWithBottomBorder = showToAccount || hasFollowingRows;

    return (
        <>
            <TransactionInfoRow
                icon={UserIconNameEnum.Calendar}
                label={t`Date`}
                value={formatDayAndFullMonthAndYear(transaction.operatedAt)}
                description={formatWeekdayWithTime(transaction.operatedAt)}
                testID={TransactionInfoPageSelector.Row.Date}
                withBottomBorder={dateWithBottomBorder}
            />

            {showFromAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`From account`}
                    value={transaction.fromAccount.title}
                    description={getAccountDescription(transaction.fromAccount)}
                    testID={TransactionInfoPageSelector.Row.FromAccount}
                    withBottomBorder={fromAccountWithBottomBorder}
                />
            ) : null}

            {showToAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.CreditCard}
                    label={t`To account`}
                    value={transaction.toAccount.title}
                    description={getAccountDescription(transaction.toAccount)}
                    testID={TransactionInfoPageSelector.Row.ToAccount}
                    withBottomBorder={hasFollowingRows}
                />
            ) : null}

            {showAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`Account`}
                    value={account.title}
                    description={getAccountDescription(account)}
                    testID={TransactionInfoPageSelector.Row.Account}
                    withBottomBorder={hasFollowingRows}
                />
            ) : null}
        </>
    );
};
