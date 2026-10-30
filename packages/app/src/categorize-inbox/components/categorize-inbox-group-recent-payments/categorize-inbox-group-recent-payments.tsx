import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionSectionTitle } from '../categorize-inbox-option-section-title/categorize-inbox-option-section-title';
import { CategorizeInboxRecentPaymentRow } from '../categorize-inbox-recent-payment-row/categorize-inbox-recent-payment-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const RECENT_PAYMENTS_LIMIT = 3;

export const CategorizeInboxGroupRecentPayments = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const total = cluster.rows.length;
    const recentRows = [...cluster.rows]
        .sort((left, right) => right.operatedAt.getTime() - left.operatedAt.getTime())
        .slice(0, RECENT_PAYMENTS_LIMIT);

    const handleSeeAllPress = (): void => void router.push({ pathname: '/categorize/payments/[key]', params: { key: cluster.key } });

    return (
        <View>
            <CategorizeInboxOptionSectionTitle>
                <Trans>Recent payments</Trans>
            </CategorizeInboxOptionSectionTitle>
            <CategorizeInboxOptionCard>
                {recentRows.map(row => (
                    <CategorizeInboxRecentPaymentRow key={row.transactionId} row={row} />
                ))}
                <HapticPressable
                    onPress={handleSeeAllPress}
                    className="min-h-[52px] flex-row items-center gap-x-md px-3xl py-xl active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={t`See all ${total}`}
                >
                    <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
                    <Text className="text-primary min-w-0 flex-1 text-[17px]">
                        <Trans>See all {total}</Trans>
                    </Text>
                    <CategorizeInboxOptionChevron />
                </HapticPressable>
            </CategorizeInboxOptionCard>
        </View>
    );
};
