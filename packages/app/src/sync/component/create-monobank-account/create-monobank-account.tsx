import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Input } from '../../../@generic/component/input/input';
import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
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
    const syncState = useBankSyncState(ExternalSourceEnum.MONOBANK);

    const [token, setToken] = useState(monobankSyncService.getToken());

    const handleGoBack = () => void goBackOrReplace('/');
    const handleToggleAccount = (accountId: number, enabled: boolean) => void monobankSyncService.setAccountEnabled(accountId, enabled);
    const handleToggleSync = async (enabled: boolean) => {
        const trimmedToken = token.trim();

        if (enabled && !isNotEmptyString(trimmedToken)) {
            Toast.show({ type: 'error', text1: t`Token required`, text2: t`Please enter your Monobank API token` });

            return;
        }

        void monobankSyncService.setEnabled(enabled, trimmedToken);

        if (enabled) {
            await microPause();
            void monobankSyncService.sync();
        }
    };

    const iconParams = { variant: 'warning', size: 15, iconSize: 15 } as const;

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

                            <SimpleHorizontalCell
                                icon="Info"
                                iconParams={iconParams}
                                size="lg"
                                variant="warning"
                                title={t`Your token is stored securely on device. Sync continues in the background.`}
                            />

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

                                {syncState.syncs.map(bankSync => (
                                    <AccountSyncCard key={bankSync.accountId} bankSync={bankSync} onToggle={handleToggleAccount} />
                                ))}
                            </View>
                        </>
                    )}
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </FullPage>
    );
};
