import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly selectedCandidate: TransactionPickerItemInterface | null;
    readonly showRevert: boolean;
    readonly onClose: () => void;
    readonly onConvert: () => void;
    readonly onRevert: () => void;
}

export const ConvertToRefundFooter = ({ selectedCandidate, showRevert, onClose, onConvert, onRevert }: Props) => {
    const { t } = useLingui();
    const isConvertDisabled = !isDefined(selectedCandidate);
    const leftAction = showRevert ? t`Done` : t`Cancel`;

    return (
        <View className="flex-row gap-x-md">
            <Button content={leftAction} variant="secondary" size="md" onPress={onClose} className="flex-1" />
            {showRevert ? (
                <Button
                    content={t`Revert`}
                    variant="destructive"
                    size="md"
                    leftIcon={UserIconNameEnum.Undo2}
                    onPress={onRevert}
                    testID={ConvertToRefundModalSelector.RevertButton}
                    className="flex-1"
                />
            ) : (
                <Button
                    content={t`Convert`}
                    variant="positive"
                    size="md"
                    leftIcon={UserIconNameEnum.ReceiptText}
                    onPress={onConvert}
                    disabled={isConvertDisabled}
                    testID={ConvertToRefundModalSelector.ConvertButton}
                    className="flex-1"
                />
            )}
        </View>
    );
};
