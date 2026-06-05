import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly accountsCountLabel: string;
    readonly defaultInstrumentSymbol: string;
    readonly formattedRate: string | null;
    readonly instrumentCode: string;
    readonly isOpen: boolean;
    readonly onPress: () => void;
    readonly testID: string;
}

export const CryptoCurrencyGroupToggleRow = ({
    accountsCountLabel,
    defaultInstrumentSymbol,
    formattedRate,
    instrumentCode,
    isOpen,
    onPress,
    testID
}: Props) => {
    const chevronIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;

    return (
        <HapticPressable onPress={onPress} className="flex-row items-end justify-between gap-x-md" testID={testID}>
            <View className="flex-row items-center gap-x-xs">
                <Text className="text-secondary-foreground text-xs">{accountsCountLabel}</Text>
                <Icon icon={chevronIcon} size={16} className="text-secondary-foreground" />
            </View>

            <Text className="shrink-0 text-right text-secondary-foreground text-xs">
                {isDefined(formattedRate) ? (
                    <Trans>
                        1 {instrumentCode} ≈ {defaultInstrumentSymbol}
                        {formattedRate}
                    </Trans>
                ) : (
                    <Trans>Missing rate</Trans>
                )}
            </Text>
        </HapticPressable>
    );
};
