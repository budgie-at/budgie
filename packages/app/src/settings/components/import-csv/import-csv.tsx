import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import Papa, { ParseResult } from 'papaparse';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { SettingsCard } from '../settings-card/settings-card';

interface ColumnMap {
    fromAccount: string;
    toAccount: string;
    category: string;
}

const parseCsvRows = async (csvText: string, onRow: (row: Record<string, string>) => void) =>
    new Promise<void>((resolve, reject) => {
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            chunk: ({ data }: ParseResult<Record<string, string>>) => {
                for (const row of data) {
                    onRow(row);
                }
            },
            complete: () => void resolve(),
            error: (error: Error) => void reject(error)
        });
    });

// TODO: Implement dynamic column mapping
const columnMap: ColumnMap = {
    fromAccount: 'Счёт',
    toAccount: 'Счёт_1',
    category: 'Категория'
};

// eslint-disable-next-line max-lines-per-function
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

    const processTransactions = async (fileContent: string) => {
        if (!isNotEmptyString(fileContent)) {
            return;
        }

        setImporting(true);
        setImportProgress(0);
        let successCount = 0;
        await parseCsvRows(fileContent, () => {
            // TODO: map row to transaction and insert in DB
            successCount += 1;
        });
        setImporting(false);
        showSuccess(successCount, 0);
    };

    const processAccountsAndCategories = async (fileContent: string) => {
        if (!isNotEmptyString(fileContent)) {
            return;
        }

        setImporting(true);
        setImportProgress(0);
        const uniqueAccounts = new Set<string>();
        const uniqueCategories = new Set<string>();
        await parseCsvRows(fileContent, row => {
            if (row[columnMap.fromAccount]) {
                uniqueAccounts.add(row[columnMap.fromAccount]);
            }
            if (row[columnMap.toAccount]) {
                uniqueAccounts.add(row[columnMap.toAccount]);
            }
            if (row[columnMap.category]) {
                uniqueCategories.add(row[columnMap.category]);
            }
        });
        console.log(uniqueAccounts, uniqueCategories);
        // TODO: create accounts and categories in DB here
        await processTransactions(fileContent);
    };

    // eslint-disable-next-line max-statements
    const handleFilePick = async () => {
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

            await processAccountsAndCategories(csvText);
        } catch (_e) {
            showError();
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
                right={importRight}
            />
        </View>
    );
};
