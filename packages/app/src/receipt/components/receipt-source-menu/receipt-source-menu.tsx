import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { Button, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { accessibilityAddTraits, accessibilityElement, accessibilityLabel } from '@expo/ui/swift-ui/modifiers';
import { useLingui } from '@lingui/react/macro';
import { Platform, StyleSheet, View } from 'react-native';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
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
    const cameraLabel = t`Scan with camera`;
    const photosLabel = t`Choose from Photos`;
    const filesLabel = t`Choose file`;
    const tile = (
        <CreateMenuTileContent
            icon={UserIconNameEnum.ScanText}
            label={label}
            testID={CreateTransactionMenuSelector.ScanReceipt}
            variant="violet"
        />
    );

    if (Platform.OS === 'android') {
        return (
            <View className="flex-1">
                <ActionsMenu trigger={tile} accessibilityLabel={label} triggerTestID={CreateTransactionMenuSelector.ScanReceipt}>
                    <ActionsMenuItem icon={UserIconNameEnum.Camera} label={cameraLabel} onPress={handleCamera} />
                    <ActionsMenuItem icon={UserIconNameEnum.Images} label={photosLabel} onPress={handlePhotos} />
                    <ActionsMenuItem icon={UserIconNameEnum.Folder} label={filesLabel} onPress={handleFiles} />
                </ActionsMenu>
            </View>
        );
    }

    const menuAccessibility = [accessibilityElement('ignore'), accessibilityLabel(label), accessibilityAddTraits(['isButton'])];

    return (
        <View className="flex-1">
            <View className="grow" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {tile}
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
                    <Button label={cameraLabel} systemImage="doc.viewfinder" onPress={handleCamera} />
                    <Button label={photosLabel} systemImage="photo.on.rectangle" onPress={handlePhotos} />
                    <Button label={filesLabel} systemImage="folder" onPress={handleFiles} />
                </Menu>
            </Host>
        </View>
    );
};
