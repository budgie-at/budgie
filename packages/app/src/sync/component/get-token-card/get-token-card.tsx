import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { Button } from '../../../@generic/component/button/button';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly url: string;
    readonly title: string;
    readonly description: string;
    readonly modalTitle: string;
}

export const GetTokenCard = ({ provider, url, title, description, modalTitle }: Props) => {
    const { t } = useLingui();
    const webViewRef = useRef<WebView>(null);
    const [isWebViewVisible, setIsWebViewVisible] = useState(false);

    const webViewSource = { uri: url };

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
                title={title}
                onPress={handleOpenWebView}
                description={description}
                left={<BankLogo bankProvider={provider} />}
            />

            <Modal animationType="slide" visible={isWebViewVisible} onRequestClose={handleCloseWebView}>
                <View className="flex-1 pt-14 bg-black">
                    <View className="flex-row items-center justify-between p-md ">
                        <Text className="text-primary">{modalTitle}</Text>
                        <Button variant="ghost" onPress={handleCloseWebView} content={t`Close`} />
                    </View>
                    <WebView ref={webViewRef} source={webViewSource} />
                </View>
            </Modal>
        </>
    );
};
