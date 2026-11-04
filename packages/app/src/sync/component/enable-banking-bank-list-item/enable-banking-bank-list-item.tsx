import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { EnableBankingBankRow } from '../enable-banking-bank-row/enable-banking-bank-row';

import type { EnableBankingBankInterface } from '@budgie/sync';

interface Props {
    readonly bank: EnableBankingBankInterface;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onSelect: (bank: EnableBankingBankInterface) => void;
}

export const EnableBankingBankListItem = ({ bank, isFirst, isLast, onSelect }: Props) => (
    <GroupedListItem isFirst={isFirst} isLast={isLast}>
        <EnableBankingBankRow bank={bank} onSelect={onSelect} />
    </GroupedListItem>
);
