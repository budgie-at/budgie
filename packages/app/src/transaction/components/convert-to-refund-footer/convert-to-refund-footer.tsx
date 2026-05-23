import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ConvertToRefundModalSelector } from '../../../app/convert-to-refund-modal.selector';

import type { ConvertToRefundFooterPropsInterface } from '../../interface/convert-to-refund-footer-props.interface';

export const ConvertToRefundFooter = ({
    selectedCandidate,
    showRevert,
    onClose,
    onConvert,
    onRevert
}: ConvertToRefundFooterPropsInterface) => {
    const { t } = useLingui();
    const isConvertDisabled = !isDefined(selectedCandidate);

    return (
        <>
            <Button
                content={t`Convert`}
                variant="positive"
                size="md"
                leftIcon={UserIconNameEnum.ReceiptText}
                onPress={onConvert}
                disabled={isConvertDisabled}
                testID={ConvertToRefundModalSelector.ConvertButton}
            />
            {showRevert ? (
                <Button
                    content={t`Revert`}
                    variant="destructive"
                    size="md"
                    leftIcon={UserIconNameEnum.Undo2}
                    onPress={onRevert}
                    testID={ConvertToRefundModalSelector.RevertButton}
                />
            ) : null}
            <Button content={t`Cancel`} variant="secondary" size="md" onPress={onClose} />
        </>
    );
};
