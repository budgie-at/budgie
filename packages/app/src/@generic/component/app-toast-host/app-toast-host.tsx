import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ReceiptScanToast } from '../../../receipt/components/receipt-scan-toast/receipt-scan-toast';
import { RECEIPT_SCAN_TOAST_TYPE } from '../../../receipt/constant/receipt-scan-toast-type.constant';
import { ACTION_TOAST_TYPE } from '../../constant/action-toast-type.constant';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { AppToast } from '../app-toast/app-toast';
import { SEARCH_LIST_BOTTOM_CLEARANCE } from '../searchable-page/searchable-page.constant';

import type { ReceiptScanToastStatusEnum } from '../../../receipt/enum/receipt-scan-toast-status.enum';
import type { ToastActionInterface } from '../../interface/toast-action.interface';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

const renderAppToast = (params: ToastConfigParams<unknown>) => (
    <View className="w-[92%]" pointerEvents="none">
        <AppToast {...params} />
    </View>
);

const renderActionToast = (params: ToastConfigParams<ToastActionInterface>) => {
    const handlePress = () => {
        params.hide();
    };

    return (
        <Pressable accessible={false} className="w-[92%]" onPress={handlePress}>
            <AppToast {...params} type="success" action={params.props} />
        </Pressable>
    );
};

const APP_TOAST_CONFIG: ToastConfig = {
    success: renderAppToast,
    error: renderAppToast,
    info: renderAppToast,
    [ACTION_TOAST_TYPE]: renderActionToast,
    [RECEIPT_SCAN_TOAST_TYPE]: (params: ToastConfigParams<ReceiptScanToastStatusEnum>) => <ReceiptScanToast {...params} />
};

export const AppToastHost = () => {
    const insets = useSafeAreaInsets();

    const topOffset = insets.top + SCREEN_CHROME_CONTENT_INSET_TOP;
    const bottomOffset = insets.bottom + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + SEARCH_LIST_BOTTOM_CLEARANCE;

    return <Toast config={APP_TOAST_CONFIG} topOffset={topOffset} bottomOffset={bottomOffset} />;
};
