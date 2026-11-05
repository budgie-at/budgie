import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';
import { TransactionPickerAction } from '../transaction-picker-action/transaction-picker-action';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly selectedCandidate: TransactionPickerItemInterface | null;
    readonly showRevert: boolean;
    readonly onConvert: () => void;
    readonly isConverting: boolean;
    readonly onRevert: () => void;
}

export const ConvertToRefundFooter = ({ selectedCandidate, showRevert, onConvert, onRevert, isConverting }: Props) => {
    const { t } = useLingui();
    const label = showRevert ? t`Undo Refund` : t`Convert`;
    const onPress = showRevert ? onRevert : onConvert;
    const disabled = !showRevert && !isDefined(selectedCandidate);
    const testID = showRevert ? ConvertToRefundModalSelector.RevertButton : ConvertToRefundModalSelector.ConvertButton;

    return <TransactionPickerAction label={label} onPress={onPress} disabled={disabled} isLoading={isConverting} testID={testID} />;
};
