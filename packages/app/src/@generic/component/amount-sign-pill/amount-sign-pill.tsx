import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { AdjustmentSelector } from '../../../transaction/components/adjustment-account-summary/adjustment-account-summary.selector';
import { SegmentedControl } from '../segmented-control/segmented-control';

interface Props {
    readonly isIncrease: boolean;
    readonly onToggle: () => void;
}

export const AmountSignPill = ({ isIncrease, onToggle }: Props) => {
    const { t } = useLingui();
    const value = isIncrease ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
    const segments = [
        { value: TransactionEntryTypeEnum.CREDIT, label: t`Decrease`, testID: AdjustmentSelector.Decrease },
        { value: TransactionEntryTypeEnum.DEBIT, label: t`Increase`, testID: AdjustmentSelector.Increase }
    ];
    const handleChange = (nextValue: TransactionEntryTypeEnum) => {
        if (nextValue !== value) {
            onToggle();
        }
    };

    return <SegmentedControl segments={segments} value={value} onChange={handleChange} className="w-full" />;
};
