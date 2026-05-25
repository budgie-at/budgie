import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_CORNER_RADIUS = 24;

export const CONSOLIDATION_SOURCE_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: 'fitToContents',
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
