import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { useLingui } from '@lingui/react/macro';

import { ActionItemLabel } from '../../../transaction/components/action-item-label/action-item-label';
import { CreateTransactionMenuSelector } from '../../../transaction/components/create-transaction-menu/create-transaction-menu.selector';
import { receiptScanRequestAtom } from '../../constant/receipt-scan-request-atom.constant';
import { ReceiptSourceEnum } from '../../enum/receipt-source.enum';

interface Props {
    readonly onClose: () => void;
}

export const ReceiptSourceMenu = ({ onClose }: Props) => {
    const { t } = useLingui();
    const requestReceiptScan = useAtomSet(receiptScanRequestAtom);

    const handleCamera = () => {
        onClose();
        requestReceiptScan(ReceiptSourceEnum.CAMERA);
    };

    const handlePhotos = () => {
        onClose();
        requestReceiptScan(ReceiptSourceEnum.PHOTOS);
    };

    const handleFiles = () => {
        onClose();
        requestReceiptScan(ReceiptSourceEnum.FILES);
    };

    return (
        <Host matchContents alignment="trailing" testID={CreateTransactionMenuSelector.ScanReceipt}>
            <Menu
                label={
                    <RNHostView matchContents>
                        <ActionItemLabel
                            icon={UserIconNameEnum.ScanText}
                            label={t`Scan receipt`}
                            testID={CreateTransactionMenuSelector.ScanReceipt}
                            variant="violet"
                        />
                    </RNHostView>
                }
            >
                <Button label={t`Scan with camera`} systemImage="doc.viewfinder" onPress={handleCamera} />
                <Button label={t`Choose from Photos`} systemImage="photo.on.rectangle" onPress={handlePhotos} />
                <Button label={t`Choose file`} systemImage="folder" onPress={handleFiles} />
            </Menu>
        </Host>
    );
};
