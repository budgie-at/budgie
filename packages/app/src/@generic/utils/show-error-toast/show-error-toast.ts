import Toast from 'react-native-toast-message';

export const showErrorToast = (text1: string, text2: string): void => {
    Toast.show({ type: 'error', text1, text2 });
};
