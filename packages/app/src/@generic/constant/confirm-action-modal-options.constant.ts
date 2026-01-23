import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const TRANSPARENT_BACKGROUND = { backgroundColor: 'transparent' };

export const CONFIRM_ACTION_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'transparentModal',
    animation: 'slide_from_bottom',
    contentStyle: TRANSPARENT_BACKGROUND
};
