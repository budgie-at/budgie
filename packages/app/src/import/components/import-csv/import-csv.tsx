import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

export const ImportCsv = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectAndNavigate = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
            if (result.canceled || !isDefined(result.assets[0]?.uri)) {
                setIsLoading(false);

                return;
            }

            router.push({ pathname: '/settings/import', params: { fileUri: result.assets[0].uri } });
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const rightSlot = isLoading ? <ActivityIndicator size="small" /> : null;

    return (
        <SettingsCard
            title={t`Import CSV`}
            description={t`Import transactions from a CSV file`}
            left={<CircleIcon size="1_5xl" icon={ICONS.Database} variant="ghost" border={false} />}
            onPress={handleSelectAndNavigate}
            right={rightSlot}
        />
    );
};
