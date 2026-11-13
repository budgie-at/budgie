import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { useLingui } from '@lingui/react/macro';
import { StyleSheet, View } from 'react-native';

import { CreateMenuTileContent } from '../../../transaction/components/create-menu-tile-content/create-menu-tile-content';
import { CreateTransactionMenuSelector } from '../../../transaction/components/create-transaction-menu/create-transaction-menu.selector';
import { createMenuButtonAccessibility } from '../../../transaction/utils/create-menu-button-accessibility.util';
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

    const label = t`Scan receipt`;

    return (
        <View className="flex-1">
            <CreateMenuTileContent
                icon={UserIconNameEnum.ScanText}
                label={label}
                testID={CreateTransactionMenuSelector.ScanReceipt}
                variant="violet"
            />
            <Host style={StyleSheet.absoluteFill} testID={CreateTransactionMenuSelector.ScanReceipt}>
                <Menu
                    label={
                        <RNHostView>
                            <View style={StyleSheet.absoluteFill} {...createMenuButtonAccessibility(label)} />
                        </RNHostView>
                    }
                >
                    <Button label={t`Scan with camera`} systemImage="doc.viewfinder" onPress={handleCamera} />
                    <Button label={t`Choose from Photos`} systemImage="photo.on.rectangle" onPress={handlePhotos} />
                    <Button label={t`Choose file`} systemImage="folder" onPress={handleFiles} />
                </Menu>
            </Host>
        </View>
    );
};
