import { NativeSegmentedControlChangeEvent, SegmentedControl } from '@expo/ui/community/segmented-control';
import { StyleSheet } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useThemeContext } from '../../../theme/context/theme.context';

interface TabOption<T> {
    readonly value: T;
    readonly label: string;
}

interface Props<T> {
    readonly options: readonly TabOption<T>[];
    readonly value: T;
    readonly onChange: (value: T) => void;
}

const styles = StyleSheet.create({
    control: {
        width: '100%'
    }
});

export const SegmentedTabs = <T,>({ options, value, onChange }: Props<T>) => {
    const { isDarkColorSchema } = useThemeContext();
    const labels = options.map(option => option.label);
    const selectedOptionIndex = options.findIndex(option => option.value === value);
    const selectedIndex = selectedOptionIndex >= 0 ? selectedOptionIndex : null;
    const appearance = isDarkColorSchema ? 'dark' : 'light';

    const handleChange = (event: NativeSegmentedControlChangeEvent) => {
        const selectedOption = options[event.nativeEvent.selectedSegmentIndex];

        if (isDefined(selectedOption)) {
            onChange(selectedOption.value);
        }
    };

    return (
        <SegmentedControl
            values={labels}
            {...(isDefined(selectedIndex) && { selectedIndex })}
            onChange={handleChange}
            appearance={appearance}
            style={styles.control}
        />
    );
};
