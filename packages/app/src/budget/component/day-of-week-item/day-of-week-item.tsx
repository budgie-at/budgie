import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';

import { StartDayOption } from '../start-day-option/start-day-option';

interface Props {
    readonly day: { value: number; label: MessageDescriptor };
    readonly isSelected: boolean;
    readonly onSelect: (value: number) => void;
}

export const DayOfWeekItem = ({ day, isSelected, onSelect }: Props) => {
    const { i18n } = useLingui();
    const handlePress = () => void onSelect(day.value);

    return <StartDayOption label={i18n.t(day.label)} isSelected={isSelected} onPress={handlePress} />;
};

