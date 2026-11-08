import { HOUSEHOLD_SYNC_ZONE, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { getAccountDisplayTitle } from '../../../account/utils/get-account-display-title.util';
import { getAccountInfoDescription } from '../../utils/get-account-info-description.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionPrivateAccountRow } from '../transaction-private-account-row/transaction-private-account-row';

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
    const { syncId, syncZone } = transaction;
    const hasPrivateSide = isTransfer && syncZone === HOUSEHOLD_SYNC_ZONE && isDefined(syncId);
    const showPrivateFrom = hasPrivateSide && !isDefined(transaction.fromAccount);
    const showPrivateTo = hasPrivateSide && !isDefined(transaction.toAccount);

    return (
        <>
            {showFromAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`From account`}
                    value={getAccountDisplayTitle(transaction.fromAccount)}
                    description={getAccountInfoDescription(transaction.fromAccount)}
                    testID={TransactionInfoPageSelector.Row.FromAccount}
                />
            ) : null}

            {showToAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.CreditCard}
                    label={t`To account`}
                    value={getAccountDisplayTitle(transaction.toAccount)}
                    description={getAccountInfoDescription(transaction.toAccount)}
                    testID={TransactionInfoPageSelector.Row.ToAccount}
                />
            ) : null}

            {showPrivateFrom && isDefined(syncId) ? (
                <TransactionPrivateAccountRow
                    label={t`From account`}
                    syncZone={syncZone}
                    syncId={syncId}
                    testID={TransactionInfoPageSelector.Row.FromAccount}
                />
            ) : null}

            {showPrivateTo && isDefined(syncId) ? (
                <TransactionPrivateAccountRow
                    label={t`To account`}
                    syncZone={syncZone}
                    syncId={syncId}
                    testID={TransactionInfoPageSelector.Row.ToAccount}
                />
            ) : null}

            {showAccount ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Wallet}
                    label={t`Account`}
                    value={getAccountDisplayTitle(account)}
                    description={getAccountInfoDescription(account)}
                    testID={TransactionInfoPageSelector.Row.Account}
                />
            ) : null}
        </>
    );
};
