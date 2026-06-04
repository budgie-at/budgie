import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
    readonly variant: ColorPaletteVariant;
}

export const AdjustmentAccountSummary = ({ details, variant }: Props) => (
    <View className="flex-row items-center gap-md rounded-2xl bg-secondary-background px-lg py-md">
        <CircleIcon icon={details.accountIcon} variant={variant} size={34} iconSize={18} radius={10} />
        <View className="flex-1">
            <Text className="text-xs text-secondary-foreground uppercase">
                <Trans>Account</Trans>
            </Text>
            <Text className="text-md font-medium text-primary" numberOfLines={1}>
                {details.accountTitle}
            </Text>
        </View>
        <Text className="text-sm font-medium text-secondary-foreground">{details.instrumentCode}</Text>
    </View>
);
