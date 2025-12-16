import { Href, router } from 'expo-router';
import { NavigationOptions } from 'expo-router/build/global-state/routing';

export const goBackOrReplace = (fallbackRoute: Href, fallbackOptions?: NavigationOptions): void => {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace(fallbackRoute, fallbackOptions);
    }
};
