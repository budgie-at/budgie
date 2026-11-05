import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly selectedCandidate: TransactionPickerItemInterface | null;
    readonly showRevert: boolean;
    readonly onClose: () => void;
    readonly onConvert: () => void;
    readonly isConverting: boolean;
    readonly onRevert: () => void;
}

export const ConvertToRefundFooter = (props: Props) => {
    const { selectedCandidate, showRevert, onClose, onConvert, onRevert, isConverting } = props;
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const footerClassName = isAccessibilityTextSize ? 'flex-col gap-y-md' : 'flex-row gap-x-md';
    const buttonClassName = isAccessibilityTextSize ? '' : 'flex-1';
    const isConvertDisabled = !isDefined(selectedCandidate);
    const leftAction = showRevert ? t`Done` : t`Cancel`;

    return (
        <View className={footerClassName}>
            <Button
                content={leftAction}
                variant="secondary"
                size="md"
                onPress={onClose}
                disabled={isConverting}
                className={buttonClassName}
            />
            {showRevert ? (
                <Button
                    content={t`Undo Refund`}
                    variant="primary"
                    size="md"
                    leftIcon={UserIconNameEnum.Undo2}
                    onPress={onRevert}
                    testID={ConvertToRefundModalSelector.RevertButton}
                    className={buttonClassName}
                />
            ) : (
                <Button
                    content={t`Convert`}
                    variant="cta"
                    size="md"
                    leftIcon={UserIconNameEnum.ReceiptText}
                    onPress={onConvert}
                    disabled={isConvertDisabled}
                    isLoading={isConverting}
                    testID={ConvertToRefundModalSelector.ConvertButton}
                    className={buttonClassName}
                />
            )}
        </View>
    );
};
