import { MONOBANK_AUTH_URL } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { Button } from '../../../@generic/component/button/button';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

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
            <SimpleHorizontalCell
                size="lg"
                title={t`Get API Token`}
                onPress={handleOpenWebView}
                description={t`Open Monobank to get your token`}
                left={<BankLogo bankProvider={ExternalSourceEnum.MONOBANK} />}
            />

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
