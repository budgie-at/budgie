import { useLingui } from '@lingui/react/macro';

import { SheetHeaderAction } from '../../../@generic/component/sheet-header-action/sheet-header-action';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';

interface Props {
    readonly onClose: () => void;
    readonly onConfirm: () => void;
    readonly disabled: boolean;
    readonly isLoading: boolean;
}

export const ConvertToRefundHeader = ({ onClose, onConfirm, disabled, isLoading }: Props) => {
    const { t } = useLingui();

    return (
        <SheetTitleRow
            title={t`Refund`}
            closeLabel={t`Cancel`}
            onClose={onClose}
            disabled={isLoading}
            trailing={
                <SheetHeaderAction
                    label={t`Done`}
                    onPress={onConfirm}
                    disabled={disabled}
                    testID={ConvertToRefundModalSelector.DoneButton}
                />
            }
        />
    );
};
