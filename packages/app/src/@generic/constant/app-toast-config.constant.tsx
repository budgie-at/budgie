import { AppToast } from '../component/app-toast/app-toast';

import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

const renderAppToast = (params: ToastConfigParams<unknown>) => <AppToast {...params} />;

export const APP_TOAST_CONFIG: ToastConfig = {
    success: renderAppToast,
    error: renderAppToast,
    info: renderAppToast
};
