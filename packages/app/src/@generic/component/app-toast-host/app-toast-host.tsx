import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ReceiptScanToast } from '../../../receipt/components/receipt-scan-toast/receipt-scan-toast';
import { RECEIPT_SCAN_TOAST_TYPE } from '../../../receipt/constant/receipt-scan-toast-type.constant';
import { ACTION_TOAST_TYPE } from '../../constant/action-toast-type.constant';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { AppToast } from '../app-toast/app-toast';
import { SEARCH_LIST_BOTTOM_CLEARANCE } from '../searchable-page/searchable-page.constant';

import type { ReceiptScanToastStatusEnum } from '../../../receipt/enum/receipt-scan-toast-status.enum';
import type { ToastActionInterface } from '../../interface/toast-action.interface';
import type { ReactNode } from 'react';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

const renderDismissibleOnTap = (hide: () => void, toast: ReactNode) => (
    <Pressable accessible={false} className="w-full items-center" onPress={hide}>
        {toast}
    </Pressable>
);

const renderAppToast = (params: ToastConfigParams<unknown>) => renderDismissibleOnTap(params.hide, <AppToast {...params} />);

const APP_TOAST_CONFIG: ToastConfig = {
    success: renderAppToast,
    error: renderAppToast,
    info: renderAppToast,
    [ACTION_TOAST_TYPE]: (params: ToastConfigParams<ToastActionInterface>) =>
        renderDismissibleOnTap(params.hide, <AppToast {...params} type="success" action={params.props} />),
    [RECEIPT_SCAN_TOAST_TYPE]: (params: ToastConfigParams<ReceiptScanToastStatusEnum>) => <ReceiptScanToast {...params} />
};

const TOAST_TOP_GAP = 8;

export const AppToastHost = () => {
    const insets = useSafeAreaInsets();

    const topOffset = insets.top + TOAST_TOP_GAP;
    const bottomOffset = insets.bottom + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + SEARCH_LIST_BOTTOM_CLEARANCE;

    return <Toast config={APP_TOAST_CONFIG} topOffset={topOffset} bottomOffset={bottomOffset} />;
};
