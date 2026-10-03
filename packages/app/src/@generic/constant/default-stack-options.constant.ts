import type { NativeStackNavigationOptions } from 'expo-router';

export const DEFAULT_STACK_OPTIONS: NativeStackNavigationOptions = {
    headerShown: false,
    scrollEdgeEffects: { top: 'hidden', bottom: 'hidden', left: 'hidden', right: 'hidden' }
};
