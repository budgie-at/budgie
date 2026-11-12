import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export const BackOrHomeRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        if (router.canGoBack()) {
            router.back();

            return;
        }

        router.replace('/');
    }, [router]);

    return null;
};
