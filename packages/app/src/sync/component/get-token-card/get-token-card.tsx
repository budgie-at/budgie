import { BankProviderEnum, MONOBANK_AUTH_URL } from '@budgie/bank-sync';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

const webViewSource = { uri: MONOBANK_AUTH_URL };

export const GetTokenCard = () => {
    const { t } = useLingui();
    const webViewRef = useRef<WebView>(null);
    const [isWebViewVisible, setIsWebViewVisible] = useState(false);

    const handleOpenWebView = () => {
        setIsWebViewVisible(true);
    };

    const handleCloseWebView = () => {
        setIsWebViewVisible(false);
    };

    return (
        <>
            <Card className="p-5xl" onPress={handleOpenWebView}>
                <View className="flex-row items-center gap-x-3xl">
                    <BankLogo bankProvider={BankProviderEnum.MONOBANK} />
                    <View className="flex-1">
                        <Text className="text-primary text-foreground text-md font-medium mb-xs">
                            <Trans>Get API Token</Trans>
                        </Text>
                        <Text className="text-primary text-muted-foreground text-sm">
                            <Trans>Open Monobank to get your token</Trans>
                        </Text>
                    </View>
                    <Icon icon={ICONS.ChevronRight} className="text-muted-foreground" />
                </View>
            </Card>

            <Modal animationType="slide" visible={isWebViewVisible} onRequestClose={handleCloseWebView}>
                <View className="flex-1 pt-14 bg-black">
                    <View className="flex-row items-center justify-between p-md ">
                        <Text className="text-primary">
                            <Trans>Create and copy the personal token</Trans>
                        </Text>
                        <Button variant="ghost" onPress={handleCloseWebView} content={t`Close`} />
                    </View>
                    <WebView ref={webViewRef} source={webViewSource} />
                </View>
            </Modal>
        </>
    );
};
