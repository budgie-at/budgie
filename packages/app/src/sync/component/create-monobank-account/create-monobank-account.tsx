import { BankProviderEnum } from '@budgie/bank-sync';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { Icon } from '../../../@generic/components/icon/icon';
import { Input } from '../../../@generic/components/input/input';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { monobankSyncService } from '../../../account/service/monobank-sync.service';
import { useBankSyncState } from '../../hook/use-bank-sync-state.hook';
import { GetTokenCard } from '../get-token-card/get-token-card';
import { SyncToggleCard } from '../sync-toggle-card/sync-toggle-card';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();
    const { isEnabled, isSyncing } = useBankSyncState(BankProviderEnum.MONOBANK);

    const [token, setToken] = useState(monobankSyncService.getToken());
    const [syncEnabled, setSyncEnabled] = useState(isEnabled);

    useEffect(() => {
        setSyncEnabled(isEnabled);
    }, [isEnabled]);

    const handleGoBack = () => void goBackOrReplace('/');
    const handleOpenMonobank = () => void monobankSyncService.openAuthPage();

    const handleToggleSync = async (enabled: boolean) => {
        const trimmedToken = token.trim();

        if (enabled && !isNotEmptyString(trimmedToken)) {
            Toast.show({ type: 'error', text1: t`Token required`, text2: t`Please enter your Monobank API token` });

            return;
        }

        if (enabled) {
            monobankSyncService.saveToken(trimmedToken);
        }

        setSyncEnabled(enabled);
        await monobankSyncService.setEnabled(enabled);

        if (enabled) {
            void monobankSyncService.sync();
            void router.replace('/');
        }
    };

    return (
        <Page
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Connect Monobank`}
                    description={t`Sync your Monobank accounts and transactions`}
                />
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    <GetTokenCard onPress={handleOpenMonobank} />

                    <View className="gap-y-md">
                        <Text className="text-primary text-muted-foreground text-sm px-md">
                            <Trans>Paste your API token below:</Trans>
                        </Text>
                        <Input
                            value={token}
                            onChangeText={setToken}
                            placeholder={t`Enter your Monobank API token`}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                            editable={!syncEnabled}
                        />
                    </View>

                    <SyncToggleCard isSyncing={isSyncing} syncEnabled={syncEnabled} onToggle={handleToggleSync} />

                    <Card className="p-4xl bg-warning/10">
                        <View className="flex-row items-start gap-x-md">
                            <Icon icon={ICONS.Info} className="text-warning mt-xs" size="sm" />
                            <Text className="text-primary text-foreground text-sm flex-1">
                                <Trans>Your token is stored securely on device. Sync continues in the background.</Trans>
                            </Text>
                        </View>
                    </Card>
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};
