import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
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
import { monobankSyncService } from '../../service/monobank-sync.service';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoBack = () => void goBackOrReplace('/');
    const handleOpenMonobank = async () => monobankSyncService.openAuthPage();
    // eslint-disable-next-line max-statements
    const handleSync = async () => {
        if (token.trim().length === 0) {
            Toast.show({ type: 'error', text1: t`Token required`, text2: t`Please enter your Monobank API token` });

            return;
        }

        setIsLoading(true);

        try {
            await monobankSyncService.saveToken(token.trim());
            const { success, error, accounts, transactions } = await monobankSyncService.fullSync();

            if (!success) {
                Toast.show({ type: 'error', text1: t`Sync failed`, text2: error ?? t`Please check your token` });

                return;
            }

            Toast.show({
                type: 'success',
                text1: t`Sync completed`,
                // eslint-disable-next-line lingui/no-expression-in-message
                text2: t`${accounts.length} accounts, ${transactions.length} transactions`
            });

            void router.replace('/');
        } catch {
            Toast.show({ type: 'error', text1: t`Something went wrong`, text2: t`Please try again later` });
        } finally {
            setIsLoading(false);
        }
    };

    const buttonContent = isLoading ? t`Syncing...` : t`Connect & Sync`;

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
                    <Button variant="default" onPress={handleSync} content={buttonContent} disabled={isLoading} />
                </Footer>
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    <Card className="p-5xl" onPress={handleOpenMonobank}>
                        <View className="flex-row items-center gap-x-3xl">
                            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                                <Icon icon={ICONS.ExternalLink} className="text-primary" />
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
