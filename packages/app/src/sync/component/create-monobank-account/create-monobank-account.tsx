import { BankProviderEnum } from '@budgie/bank-sync';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { Icon } from '../../../@generic/components/icon/icon';
import { Input } from '../../../@generic/components/input/input';
import { FullPage } from '../../../@generic/components/page/full-page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { microPause } from '../../../@generic/utils/micro-pause.util';
import { useBankSyncState } from '../../hook/use-bank-sync-state.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { AccountSyncCard } from '../account-sync-card/account-sync-card';
import { GetTokenCard } from '../get-token-card/get-token-card';
import { SyncStatusCard } from '../sync-status-card/sync-status-card';
import { SyncToggleCard } from '../sync-toggle-card/sync-toggle-card';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();
    const syncState = useBankSyncState(BankProviderEnum.MONOBANK);

    const [token, setToken] = useState(monobankSyncService.getToken());

    const handleGoBack = () => void goBackOrReplace('/');
    const handleToggleAccount = (accountId: number, enabled: boolean) => void monobankSyncService.setAccountEnabled(accountId, enabled);
    const handleToggleSync = async (enabled: boolean) => {
        const trimmedToken = token.trim();

        if (enabled && !isNotEmptyString(trimmedToken)) {
            Toast.show({ type: 'error', text1: t`Token required`, text2: t`Please enter your Monobank API token` });

            return;
        }

        if (enabled) {
            monobankSyncService.saveToken(trimmedToken);
        }

        monobankSyncService.setEnabled(enabled);

        if (enabled) {
            await microPause();
            void monobankSyncService.sync();
        }
    };

    const cursors = Object.values(syncState.accountCursors);

    return (
        <FullPage
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
                    <SyncToggleCard syncEnabled={syncState.enabled} onToggle={handleToggleSync} />

                    {!syncState.enabled && (
                        <>
                            <GetTokenCard />
                            <Card className="p-4xl bg-warning/10">
                                <View className="flex-row items-start gap-x-md">
                                    <Icon icon={ICONS.Info} className="text-warning mt-xs" size="sm" />
                                    <Text className="text-primary text-foreground text-sm flex-1">
                                        <Trans>Your token is stored securely on device. Sync continues in the background.</Trans>
                                    </Text>
                                </View>
                            </Card>
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
                                    editable={!syncState.enabled}
                                />
                            </View>
                        </>
                    )}

                    {syncState.enabled && (
                        <>
                            <SyncStatusCard syncState={syncState} />

                            <View className="gap-y-md">
                                <Text className="text-primary text-muted-foreground text-sm px-md">
                                    <Trans>Accounts</Trans>
                                </Text>
                                {cursors.map(cursor => (
                                    <AccountSyncCard key={cursor.accountId} cursor={cursor} onToggle={handleToggleAccount} />
                                ))}
                            </View>
                        </>
                    )}
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </FullPage>
    );
};
