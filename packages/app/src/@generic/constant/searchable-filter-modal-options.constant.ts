import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

const SHEET_DETENT = 0.7;
const SHEET_CORNER_RADIUS = 24;

export const SEARCHABLE_FILTER_MODAL_OPTIONS: ExtendedStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT],
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
