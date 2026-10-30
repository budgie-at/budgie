import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { isTransactionNoteDuplicated } from '../../utils/is-transaction-note-duplicated.util';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoNoteGroup = ({ transaction }: Props) => {
    const { t } = useLingui();

    if (!isNotEmptyString(transaction.comment) || isTransactionNoteDuplicated(transaction)) {
        return null;
    }

    return (
        <TransactionInfoGroup>
            <TransactionInfoRow
                icon={UserIconNameEnum.MessageSquare}
                label={t`Note`}
                value={transaction.comment}
                valueClassName="leading-[24px]"
                testID={TransactionInfoPageSelector.Row.Note}
            />
        </TransactionInfoGroup>
    );
};
