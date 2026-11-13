import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { accessibilityAddTraits, accessibilityElement, accessibilityLabel } from '@expo/ui/swift-ui/modifiers';
import { useLingui } from '@lingui/react/macro';
import { StyleSheet, View } from 'react-native';

import { CreateMenuTileContent } from '../../../transaction/components/create-menu-tile-content/create-menu-tile-content';
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

    const label = t`Scan receipt`;
    const menuAccessibility = [accessibilityElement('ignore'), accessibilityLabel(label), accessibilityAddTraits(['isButton'])];

    return (
        <View className="flex-1">
            <View className="grow" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <CreateMenuTileContent
                    icon={UserIconNameEnum.ScanText}
                    label={label}
                    testID={CreateTransactionMenuSelector.ScanReceipt}
                    variant="violet"
                />
            </View>
            <Host style={StyleSheet.absoluteFill} testID={CreateTransactionMenuSelector.ScanReceipt}>
                <Menu
                    label={
                        <RNHostView>
                            <View style={StyleSheet.absoluteFill} />
                        </RNHostView>
                    }
                    modifiers={menuAccessibility}
                >
                    <Button label={t`Scan with camera`} systemImage="doc.viewfinder" onPress={handleCamera} />
                    <Button label={t`Choose from Photos`} systemImage="photo.on.rectangle" onPress={handlePhotos} />
                    <Button label={t`Choose file`} systemImage="folder" onPress={handleFiles} />
                </Menu>
            </Host>
        </View>
    );
};
