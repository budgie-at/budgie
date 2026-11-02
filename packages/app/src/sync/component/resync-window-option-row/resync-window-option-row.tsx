import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ResyncWindowPickerSelector } from '../../../app/resync-window-picker.selector';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import type { ResyncWindowOptionInterface } from '../../interface/resync-window-option.interface';

interface Props {
    readonly option: ResyncWindowOptionInterface;
    readonly onSelect: (sinceDays: number | null) => void;
}

const WINDOW_LABELS: Record<string, MessageDescriptor> = {
    7: msg`Last 7 days`,
    30: msg`Last 30 days`,
    90: msg`Last 90 days`,
    null: msg`Entire available history`
};

export const ResyncWindowOptionRow = ({ option, onSelect }: Props) => {
    const { t } = useLingui();
    const handlePress = () => void onSelect(option.sinceDays);

    return (
        <SettingsRow
            title={t(WINDOW_LABELS[String(option.sinceDays)])}
            icon={option.icon}
            variant="primary"
            onPress={handlePress}
            right={<View />}
            testID={ResyncWindowPickerSelector.Option(option.sinceDays ?? 'all')}
        />
    );
};
