import { View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly value: boolean;
    readonly onValueChange: (next: boolean) => void;
    readonly testID: string;
    readonly stateOnTestID: string;
    readonly stateOffTestID: string;
}

export const SettingSwitch = ({ value, onValueChange, testID, stateOnTestID, stateOffTestID }: Props) => {
    const stateMarkerTestID = value ? stateOnTestID : stateOffTestID;

    return (
        <View className="flex-row items-center gap-x-xs">
            <View testID={stateMarkerTestID} className="h-1 w-1" />
            <ThemedSwitch testID={testID} value={value} onValueChange={onValueChange} />
        </View>
    );
};
