import { StackActions } from '@react-navigation/native';
import { Stack, useFocusEffect, useNavigation, useSegments } from 'expo-router';
import { useCallback } from 'react';

import { ScreenLayout } from '../../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../@generic/constant/default-stack-options.constant';

export default function SettingsLayout() {
    const navigation = useNavigation();
    const segments = useSegments();
    const isOnNestedPage = segments.length > 2;

    useFocusEffect(
        useCallback(
            () => () => {
                if (isOnNestedPage) {
                    navigation.dispatch(StackActions.popToTop());
                }
            },
            [isOnNestedPage, navigation]
        )
    );

    return <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout} />;
}
