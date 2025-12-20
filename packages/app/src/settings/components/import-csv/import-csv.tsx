import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import Papa, { ParseError, ParseResult } from 'papaparse';
import { useState } from 'react';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SettingsCard } from '../settings-card/settings-card';

export const ImportCsv = () => {
    const { t } = useLingui();
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const importRight = importing ? (
        <Text>
            {t`Importing...`} {importProgress}
        </Text>
    ) : null;

    const showSuccess = (successCount: number, errorCount: number) => {
        Toast.show({
            type: 'success',
            text1: t`Import complete`,
            text2: t`${successCount} rows imported, ${errorCount} errors.`
        });
    };

    const showError = () => {
        Toast.show({
            type: 'error',
            text1: t`Import failed`,
            text2: t`Could not import CSV. Please try again.`
        });
    };

    const parseCsv = async (csvText: string): Promise<{ successCount: number; errorCount: number }> => {
        let successCount = 0;
        let errorCount = 0;
        await new Promise<void>((resolve, reject) => {
            Papa.parse<Record<string, string>>(csvText, {
                header: true,
                skipEmptyLines: true,
                chunk: ({ data, errors }: ParseResult<Record<string, string>>) => {
                    setImportProgress(prev => prev + data.length);
                    successCount += data.length - errors.length;
                    errorCount += errors.length;
                },
                complete: () => {
                    resolve();
                },
                error: (err: ParseError) => {
                    reject(err);
                }
            });
        });

        return { successCount, errorCount };
    };

    // eslint-disable-next-line max-statements
    const handleImportCsv = async (): Promise<void> => {
        setImporting(true);
        setImportProgress(0);
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
            const { successCount, errorCount } = await parseCsv(csvText);
            showSuccess(successCount, errorCount);
        } catch (_e) {
            showError();
        } finally {
            setImporting(false);
            setImportProgress(0);
        }
    };

    return (
        <SettingsCard
            title={t`Import CSV`}
            description={t`Import transactions from a CSV file`}
            left={<CircleIcon size="1_5xl" icon={ICONS.Database} variant="ghost" border={false} />}
            onPress={handleImportCsv}
            right={importRight}
        />
    );
};
