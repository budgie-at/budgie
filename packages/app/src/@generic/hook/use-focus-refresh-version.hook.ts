import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

export const useFocusRefreshVersion = () => {
    const navigation = useNavigation();
    const [refreshVersion, setRefreshVersion] = useState(0);

    const refresh = () => {
        setRefreshVersion(version => version + 1);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', refresh);

        return unsubscribe;
    }, [navigation]);

    return { refresh, refreshVersion };
};
