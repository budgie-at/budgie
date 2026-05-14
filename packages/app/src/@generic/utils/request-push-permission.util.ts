import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const postLocalNotification = async (title: string, body: string): Promise<void> => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('budget-alerts', {
            name: 'Budget Alerts', // eslint-disable-line lingui/no-unlocalized-strings
            importance: Notifications.AndroidImportance.DEFAULT
        });
    }

    await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null
    });
};
