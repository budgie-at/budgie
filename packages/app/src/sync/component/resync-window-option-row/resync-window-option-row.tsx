import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

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
    const subtitle =
        option.sinceDays === null ? (
            <Text className="text-[13px] text-secondary-foreground">
                <Trans>May take a few minutes</Trans>
            </Text>
        ) : null;
    const handlePress = () => void onSelect(option.sinceDays);

    return (
        <View className="bg-grouped-surface-row">
            <SettingsRow
                title={t(WINDOW_LABELS[String(option.sinceDays)])}
                subtitle={subtitle}
                icon={option.icon}
                variant="primary"
                onPress={handlePress}
                right={<View />}
                testID={ResyncWindowPickerSelector.Option(option.sinceDays ?? 'all')}
            />
        </View>
    );
};
