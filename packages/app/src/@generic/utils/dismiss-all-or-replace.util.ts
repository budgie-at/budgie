import { Href, router } from 'expo-router';
import { NavigationOptions } from 'expo-router/build/global-state/routing';

export const dismissAllOrReplace = (fallbackRoute: Href, fallbackOptions?: NavigationOptions): void => {
    if (router.canDismiss() && router.canGoBack()) {
        router.dismissAll();
    } else {
        router.replace(fallbackRoute, fallbackOptions);
    }
};
