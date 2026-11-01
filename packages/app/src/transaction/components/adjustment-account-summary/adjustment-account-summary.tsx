import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: AdjustmentTransactionDetailsInterface;
}

export const AdjustmentAccountSummary = ({ details }: Props) => (
    <View className="min-h-[56px] flex-row items-center gap-md rounded-2xl border-hairline border-surface-separator bg-transaction-detail-row px-lg py-md dark:border-transparent">
        <CircleIcon icon={details.accountIcon} variant="ghost" border={false} size={34} iconSize={18} radius={10} />
        <View className="flex-1">
            <Text className="text-[13px] leading-[18px] text-secondary-foreground">
                <Trans>Account</Trans>
            </Text>
            <Text className="text-[15px] leading-[20px] font-medium text-primary" numberOfLines={1}>
                {details.accountTitle}
            </Text>
        </View>
        <Text className="text-sm font-medium text-secondary-foreground">{details.instrumentCode}</Text>
    </View>
);
