import type { NativeStackNavigationOptions } from 'expo-router';

const SHEET_DETENT_MEDIUM = 0.65;
const SHEET_DETENT_LARGE = 0.95;
const SHEET_CORNER_RADIUS = 24;

export const VOICE_REVIEW_MODAL_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [SHEET_DETENT_MEDIUM, SHEET_DETENT_LARGE],
    sheetInitialDetentIndex: 0,
    sheetCornerRadius: SHEET_CORNER_RADIUS,
    contentStyle: { backgroundColor: 'transparent' }
};
