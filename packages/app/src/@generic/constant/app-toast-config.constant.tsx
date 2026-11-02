import { ReceiptScanToast } from '../../receipt/components/receipt-scan-toast/receipt-scan-toast';
import { RECEIPT_SCAN_TOAST_TYPE } from '../../receipt/constant/receipt-scan-toast-type.constant';
import { AppToast } from '../component/app-toast/app-toast';

import { ACTION_TOAST_TYPE } from './action-toast-type.constant';

import type { ReceiptScanToastStatusEnum } from '../../receipt/enum/receipt-scan-toast-status.enum';
import type { ToastActionInterface } from '../interface/toast-action.interface';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

const renderAppToast = (params: ToastConfigParams<unknown>) => <AppToast {...params} />;

export const APP_TOAST_CONFIG: ToastConfig = {
    success: renderAppToast,
    error: renderAppToast,
    info: renderAppToast,
    [ACTION_TOAST_TYPE]: (params: ToastConfigParams<ToastActionInterface>) => <AppToast {...params} type="success" action={params.props} />,
    [RECEIPT_SCAN_TOAST_TYPE]: (params: ToastConfigParams<ReceiptScanToastStatusEnum>) => <ReceiptScanToast {...params} />
};
