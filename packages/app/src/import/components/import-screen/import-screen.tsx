import { useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Page } from '../../../@generic/components/page/page';
import { ImportProgressInterface } from '../../interface/import-progress.interface';
import { ImporterColumnMapInterface } from '../../interface/importer-column-map.interface';
import { ImporterWithProgress } from '../../service/importer-with-progress.service';
import { countCsvRows, parseCsvHeaders } from '../../util/csv-parser.util';
import { ImportColumnMapForm } from '../import-column-map-form/import-column-map-form';
import { ImportProgressView } from '../import-progress-view/import-progress-view';

import type { Edge } from 'react-native-safe-area-context';

const SAFE_EDGES: Edge[] = ['bottom'];
const INITIAL_PROGRESS: ImportProgressInterface = { total: 0, processed: 0, successful: 0, errors: 0 };

type ImportStep = 'loading' | 'mapping' | 'importing';

export const ImportScreen = () => {
    const { t } = useLingui();
    const { fileUri } = useLocalSearchParams<{ fileUri: string }>();

    const [step, setStep] = useState<ImportStep>('loading');
    const [csvText, setCsvText] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [progress, setProgress] = useState<ImportProgressInterface>(INITIAL_PROGRESS);

    useEffect(() => {
        const loadFile = async () => {
            if (!isNotEmptyString(fileUri)) {
                return;
            }

            try {
                const response = await fetch(fileUri);
                const text = await response.text();
                const [parsedHeaders, count] = await Promise.all([parseCsvHeaders(text), countCsvRows(text)]);

                setCsvText(text);
                setHeaders(parsedHeaders);
                setRowCount(count);
                setStep('mapping');
            } catch (error) {
                Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
                router.back();
            }
        };

        void loadFile();
    }, [fileUri, t]);

    // eslint-disable-next-line max-statements
    const handleStartImport = async (columnMap: ImporterColumnMapInterface) => {
        setStep('importing');
        setProgress({ ...INITIAL_PROGRESS, total: rowCount });

        try {
            const importer = new ImporterWithProgress(columnMap, setProgress);
            const finalProgress = await importer.process(csvText, rowCount);

            const hasErrors = finalProgress.errors > 0;
            const successCount = finalProgress.successful;
            const errorCount = finalProgress.errors;
            const toastType = hasErrors ? 'info' : 'success';
            const text2 = hasErrors ? t`${successCount} imported, ${errorCount} failed` : t`${successCount} transactions imported`;
            Toast.show({ type: toastType, text1: t`Import Complete`, text2 });
            router.back();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Import Failed`, text2: getErrorMessage(error) });
            setStep('mapping');
        }
    };

    return (
        <Page safeEdges={SAFE_EDGES}>
            {step === 'loading' && (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" />
                </View>
            )}
            {step === 'mapping' && <ImportColumnMapForm headers={headers} onStartImport={handleStartImport} rowCount={rowCount} />}
            {step === 'importing' && <ImportProgressView progress={progress} />}
        </Page>
    );
};
