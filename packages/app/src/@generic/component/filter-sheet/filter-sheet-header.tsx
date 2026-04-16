import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly title: string;
    readonly onClear: EmptyFn;
    readonly showClear: boolean;
}

export const FilterSheetHeader = ({ title, onClear, showClear }: Props) => {
    const { backgroundColor } = useFormsheetListStyles();
    const style = { backgroundColor };

    return (
        <View className="flex-row items-center justify-between border-b border-b-secondary-corner px-xl py-lg" style={style}>
            <Text className="text-xl font-bold tracking-tight text-primary">{title}</Text>

            {showClear ? (
                <HapticPressable className="rounded-full bg-secondary-background px-lg py-sm" onPress={onClear}>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                        <Trans>Clear</Trans>
                    </Text>
                </HapticPressable>
            ) : null}
        </View>
    );
};
