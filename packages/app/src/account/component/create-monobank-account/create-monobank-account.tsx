import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/components/button/button';
import { Card } from '../../../@generic/components/card/card';
import { Footer } from '../../../@generic/components/footer/footer';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { Icon } from '../../../@generic/components/icon/icon';
import { Input } from '../../../@generic/components/input/input';
import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { MONOBANK_LOGO } from '../../constant/monobank-logo.constant';
import { useMonobankSync } from '../../hook/use-monobank-sync.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';

const LOGO_SIZE = 32;

const styles = StyleSheet.create({
    logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 8 }
});

export const CreateMonobankAccount = () => {
    const { t } = useLingui();
    const { sync, isSyncing } = useMonobankSync();

    const [token, setToken] = useState(monobankSyncService.getToken());

    const handleGoBack = () => void goBackOrReplace('/');
    const handleOpenMonobank = async () => monobankSyncService.openAuthPage();

    const handleSync = async () => {
        if (token.trim().length === 0) {
            Toast.show({ type: 'error', text1: t`Token required`, text2: t`Please enter your Monobank API token` });

            return;
        }

        monobankSyncService.saveToken(token.trim());
        await sync();
        void router.replace('/');
    };

    const buttonContent = isSyncing ? t`Syncing...` : t`Connect & Sync`;

    return (
        <Page
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Connect Monobank`}
                    description={t`Sync your Monobank accounts and transactions`}
                />
            }
            footer={
                <Footer>
                    <Button variant="default" onPress={handleSync} content={buttonContent} disabled={isSyncing} />
                </Footer>
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    <Card className="p-5xl" onPress={handleOpenMonobank}>
                        <View className="flex-row items-center gap-x-3xl">
                            <View className="w-12 h-12 rounded-xl bg-black items-center justify-center">
                                <Image source={MONOBANK_LOGO} style={styles.logo} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-primary text-md font-medium mb-xs">{t`Get API Token`}</Text>
                                <Text className="text-secondary-foreground text-sm">{t`Open Monobank to get your token`}</Text>
                            </View>
                            <Icon icon={ICONS.ChevronRight} className="text-primary/40" />
                        </View>
                    </Card>

                    <View className="gap-y-md">
                        <Text className="text-secondary-foreground text-sm px-md">{t`Paste your API token below:`}</Text>
                        <Input
                            value={token}
                            onChangeText={setToken}
                            placeholder={t`Enter your Monobank API token`}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                        />
                    </View>

                    <Card className="p-4xl bg-warning/10">
                        <View className="flex-row items-start gap-x-md">
                            <Icon icon={ICONS.Info} className="text-warning mt-xs" size="sm" />
                            <View className="flex-1">
                                <Text className="text-primary text-sm">{t`Your token is stored securely on device.`}</Text>
                            </View>
                        </View>
                    </Card>
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};
