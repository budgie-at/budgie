import Toast from 'react-native-toast-message';

import { ACTION_TOAST_TYPE } from '../../constant/action-toast-type.constant';

import type { ToastActionInterface } from '../../interface/toast-action.interface';

export const showActionToast = (text1: string, action: ToastActionInterface): void => {
    Toast.show({ type: ACTION_TOAST_TYPE, text1, props: action, position: 'bottom', visibilityTime: 5000 });
};
