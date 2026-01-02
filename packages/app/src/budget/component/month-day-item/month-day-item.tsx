import { StartDayOption } from '../start-day-option/start-day-option';

interface Props {
    readonly day: number;
    readonly isSelected: boolean;
    readonly onSelect: (value: number) => void;
}

export const MonthDayItem = ({ day, isSelected, onSelect }: Props) => {
    const handlePress = () => void onSelect(day);

    return <StartDayOption label={String(day)} isSelected={isSelected} onPress={handlePress} wide />;
};

