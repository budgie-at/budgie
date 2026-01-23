import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

export const CONFIRM_ACTION_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
    sheetGrabberVisible: true,
    sheetCornerRadius: 24
};
