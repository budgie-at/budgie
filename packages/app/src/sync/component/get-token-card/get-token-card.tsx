import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { Button } from '../../../@generic/component/button/button';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly url: string;
    readonly title: string;
    readonly description: string;
    readonly modalTitle: string;
}

export const GetTokenCard = ({ provider, url, title, description, modalTitle }: Props) => {
    const { t } = useLingui();
    const webViewRef = useRef<WebView<object>>(null);
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
            <GroupedListRow
                left={<BankLogo bankProvider={provider} size={36} />}
                title={title}
                subtitle={description}
                onPress={handleOpenWebView}
            />

            <Modal animationType="slide" visible={isWebViewVisible} onRequestClose={handleCloseWebView}>
                <View className="flex-1 pt-14 bg-primary-reverse">
                    <View className="flex-row items-center justify-between p-md ">
                        <Text className="text-primary">{modalTitle}</Text>
                        <Button variant="ghost" onPress={handleCloseWebView} content={t`Close`} />
                    </View>
                    <WebView<object> ref={webViewRef} source={webViewSource} />
                </View>
            </Modal>
        </>
    );
};
