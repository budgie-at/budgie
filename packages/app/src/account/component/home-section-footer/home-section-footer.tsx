import { HomeSectionInterface } from '../../interface/home-section.interface';
import { isCashSection } from '../../type-guard/is-cash-section.type-guard';
import { CashRecordExpenseRow } from '../cash-record-expense-row/cash-record-expense-row';

interface Props {
    readonly section: HomeSectionInterface;
}

export const HomeSectionFooter = ({ section }: Props) =>
    isCashSection(section) ? <CashRecordExpenseRow accountId={section.data[0].id} /> : null;
