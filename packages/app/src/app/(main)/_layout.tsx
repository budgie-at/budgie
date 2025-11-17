import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Stack } from 'expo-router';

const screenOptions: NativeStackNavigationOptions = {
    headerShown: false,
};

export default function Layout() {
    return <Stack screenOptions={screenOptions} />;
}
