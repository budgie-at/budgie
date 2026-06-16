import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';

const handleOpenSettings = () => void router.push('/settings');

export const BudgetMissingCurrencyGuard = () => (
    <View className="bg-primary-reverse flex-1 items-center justify-center gap-y-xl px-3xl">
        <Text className="text-primary-foreground text-lg font-semibold text-center">
            <Trans>Set a default currency in Settings first</Trans>
        </Text>
        <Button variant="primary" content={t`Open settings`} onPress={handleOpenSettings} />
    </View>
);
