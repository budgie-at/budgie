/* eslint-disable lingui/no-unlocalized-strings */
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { Importer } from '../../importer';

// TODO: Implement dynamic column mapping
export const ImportCsv = () => {
    const { t } = useLingui();
    const [importing, setImporting] = useState(false);

    // eslint-disable-next-line max-statements
    const handleFilePick = async () => {
        setImporting(true);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'text/csv',
                copyToCacheDirectory: true
            });

            if (result.canceled || !result.assets[0]?.uri) {
                setImporting(false);

                return;
            }

            const fileUri = result.assets[0].uri;
            const response = await fetch(fileUri);
            const csvText = await response.text();

            const importer = new Importer({
                externalId: 'Порядковый номер',
                fromAccount: 'Счёт_1',
                toAccount: 'Счёт',
                category: 'Категория',
                operatedAt: 'Дата',
                comment: 'Описание',
                amount: 'Сумма',
                toCurrency: 'Валюта',
                fromCurrency: 'Валюта 2'
            });

            const [successCount, errorCount] = await importer.process(csvText);

            Toast.show({
                type: 'success',
                text1: t`Import complete`,
                text2: t`${successCount} rows imported, ${errorCount} errors.`
            });
        } catch (_e) {
            Toast.show({
                type: 'error',
                text1: t`Import failed`,
                text2: t`Could not import CSV. Please try again.`
            });
            setImporting(false);
        }
    };

    return (
        <View>
            <SettingsCard
                title={t`Import CSV`}
                description={t`Import transactions from a CSV file`}
                left={<CircleIcon size="1_5xl" icon={ICONS.Database} variant="ghost" border={false} />}
                onPress={handleFilePick}
                {...(importing && { right: <ActivityIndicator size="large" color="primary" /> })}
            />
        </View>
    );
};
