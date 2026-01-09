import { UserIconNameEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { TabButton } from '../../../@generic/component/tab-button/tab-button';

export const SettingsTabButton = () => {
    const router = useRouter();

    const handlePress = () => void router.push('/(main)/settings');

    return <TabButton icon={UserIconNameEnum.Settings} onPress={handlePress} />;
};
