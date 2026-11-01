import Toast from 'react-native-toast-message';

export const showSuccessToast = (text1: string): void => {
    Toast.show({ type: 'success', text1 });
};
