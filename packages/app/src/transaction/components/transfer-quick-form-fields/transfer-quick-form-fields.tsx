import { isDefined } from '@rnw-community/shared';

import { TransactionDateFieldIcon } from '../transaction-date-field-icon/transaction-date-field-icon';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionNoteFieldIcon } from '../transaction-note-field-icon/transaction-note-field-icon';
import { TransactionSourcesFieldIcon } from '../transaction-sources-field-icon/transaction-sources-field-icon';

import type { ReactNode } from 'react';

interface Props {
    readonly onDatePress: () => void;
    readonly onConsolidationPress?: () => void;
    readonly children: ReactNode;
}

export const TransferQuickFormFields = ({ onDatePress, onConsolidationPress, children }: Props) => (
    <TransactionFieldIcons>
        <TransactionDateFieldIcon onPress={onDatePress} />

        {children}
        <TransactionNoteFieldIcon />
        {isDefined(onConsolidationPress) ? <TransactionSourcesFieldIcon onPress={onConsolidationPress} /> : null}
    </TransactionFieldIcons>
);
