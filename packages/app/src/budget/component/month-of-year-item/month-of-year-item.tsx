import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';

import { StartDayOption } from '../start-day-option/start-day-option';

interface Props {
    readonly month: { value: number; label: MessageDescriptor };
    readonly isSelected: boolean;
    readonly onSelect: (value: number) => void;
    readonly wide?: boolean;
}

export const MonthOfYearItem = ({ month, isSelected, onSelect, wide }: Props) => {
    const { i18n } = useLingui();
    const handlePress = () => void onSelect(month.value);

    return <StartDayOption label={i18n.t(month.label)} isSelected={isSelected} onPress={handlePress} wide={wide} />;
};

