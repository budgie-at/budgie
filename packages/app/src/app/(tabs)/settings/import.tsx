import { UserIconNameEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import {
    accountBalanceRepository,
    accountRepository,
    categoryRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../../@generic/drizzle/db/db';
import { microPause } from '../../../@generic/utils/micro-pause.util';
import { readTextFileFromUri } from '../../../@generic/utils/read-text-file-from-uri.util';
import { accountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { ImportColumnMapField } from '../../../import/components/import-column-map-field/import-column-map-field';
import { ImportPresetPicker } from '../../../import/components/import-preset-picker/import-preset-picker';
import { IMPORT_PRESETS } from '../../../import/constant/import-presets.constant';
import { ImportPresetEnum } from '../../../import/enum/import-preset.enum';
import { ImporterColumnMapInterface } from '../../../import/interface/importer-column-map.interface';
import { ImportColumnMapFormValues, ImportColumnMapSchema } from '../../../import/schema/import-column-map.schema';
import { ImporterService } from '../../../import/service/importer.service';
import { countCsvRows, parseCsvHeaders } from '../../../import/util/csv-parser.util';

import { ImportScreenSelector } from './import-screen.selector';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function ImportScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

    const { t } = useLingui();

    const [csvText, setCsvText] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<ImportPresetEnum | undefined>();

    const headersSet = new Set(headers);

    const schemaWithHeaders = ImportColumnMapSchema.refine(data => headersSet.has(data.toAccount), {
        message: t`Select a valid column`,
        path: ['toAccount']
    })
        .refine(data => headersSet.has(data.category), { message: t`Select a valid column`, path: ['category'] })
        .refine(data => headersSet.has(data.operatedAt), { message: t`Select a valid column`, path: ['operatedAt'] })
        .refine(data => headersSet.has(data.toAmount), { message: t`Select a valid column`, path: ['toAmount'] })
        .refine(data => headersSet.has(data.toCurrency), { message: t`Select a valid column`, path: ['toCurrency'] });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ImportColumnMapFormValues>({
        resolver: zodResolver(schemaWithHeaders),
        defaultValues: {
            toAccount: '',
            category: '',
            operatedAt: '',
            toAmount: '',
            toCurrency: '',
            externalId: '',
            fromAccount: '',
            fromCurrency: '',
            fromAmount: '',
            comment: '',
            isPlanned: '',
            mcc: ''
        },
        mode: 'onSubmit'
    });

    const formValues = useWatch({ control });
    const selectedHeaders = Object.values(formValues).filter(isNotEmptyString);

    const handlePresetSelect = (preset: ImportPresetEnum) => {
        setSelectedPreset(preset);
        reset(IMPORT_PRESETS[preset]);
    };

    useEffect(() => {
        const loadFile = async () => {
            if (!isNotEmptyString(fileUri)) {
                return;
            }

            setIsLoading(true);

            try {
                const text = await readTextFileFromUri(fileUri);
                const [parsedHeaders, count] = await Promise.all([parseCsvHeaders(text), countCsvRows(text)]);

                setCsvText(text);
                setHeaders(parsedHeaders);
                setRowCount(count);
            } catch (error) {
                Toast.show({ type: 'error', text1: t`Could not read CSV file`, text2: getErrorMessage(error) });
                router.back();
            }

            setIsLoading(false);
        };

        void loadFile();
    }, [fileUri, t]);

    const handleStartImport = async (columnMap: ImporterColumnMapInterface) => {
        setIsLoading(true);

        await microPause();

        const importer = new ImporterService(columnMap);

        try {
            await accountRepository.truncate();
            await categoryRepository.truncate(false);
            await transactionTagsRepository.truncate();
            await transactionEntryRepository.truncate();
            await transactionRepository.truncate();
            await accountBalanceRepository.truncate();

            await importer.process(csvText, rowCount);

            await accountBalanceIncrementalService.updateAllBalances(true);

            router.back();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Could not import CSV file`, text2: getErrorMessage(error) });
        }

        setIsLoading(false);
    };
    const handleCancel = () => void router.back();

    const hasErrors = isNotEmptyArray(Object.keys(errors));
    const buttonContent = hasErrors ? t`Fix Errors` : t`Start Import`;

    const rowCountBadge = (
        <View className="bg-primary px-3xl py-md rounded-full">
            <Text className="text-primary-reverse text-sm font-medium">{rowCount}</Text>
        </View>
    );

    return (
        <CollapsibleChromePage
            title={t`Map CSV Columns`}
            subtitle={t`Match each field to a column from your CSV file`}
            trailing={rowCountBadge}
            contentClassName="gap-y-xl"
            footer={
                <View className="flex-row gap-x-md">
                    <View className="flex-1">
                        <Button content={t`Cancel`} variant="ghost" onPress={handleCancel} />
                    </View>
                    <View className="flex-[2] align-middle justify-center ">
                        {isLoading ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <Button
                                content={buttonContent}
                                variant="positive"
                                onPress={handleSubmit(handleStartImport)}
                                leftIcon={UserIconNameEnum.Database}
                                testID={ImportScreenSelector.StartImportButton}
                            />
                        )}
                    </View>
                </View>
            }
        >
            <ImportPresetPicker selectedPreset={selectedPreset} onPresetSelect={handlePresetSelect} />
            <ImportColumnMapField
                control={control}
                name="toAccount"
                label={t`To Account`}
                headers={headers}
                selectedHeaders={selectedHeaders}
                isRequired
            />
            <ImportColumnMapField
                control={control}
                name="category"
                label={t`Category`}
                headers={headers}
                selectedHeaders={selectedHeaders}
                isRequired
            />
            <ImportColumnMapField
                control={control}
                name="operatedAt"
                label={t`Date`}
                headers={headers}
                selectedHeaders={selectedHeaders}
                isRequired
            />
            <ImportColumnMapField
                control={control}
                name="toAmount"
                label={t`Amount`}
                headers={headers}
                selectedHeaders={selectedHeaders}
                isRequired
            />
            <ImportColumnMapField
                control={control}
                name="toCurrency"
                label={t`To Currency`}
                headers={headers}
                selectedHeaders={selectedHeaders}
                isRequired
            />
            <ImportColumnMapField
                control={control}
                name="externalId"
                label={t`External ID`}
                headers={headers}
                selectedHeaders={selectedHeaders}
            />
            <ImportColumnMapField
                control={control}
                name="fromAccount"
                label={t`From Account`}
                headers={headers}
                selectedHeaders={selectedHeaders}
            />
            <ImportColumnMapField
                control={control}
                name="fromCurrency"
                label={t`From Currency`}
                headers={headers}
                selectedHeaders={selectedHeaders}
            />
            <ImportColumnMapField
                control={control}
                name="fromAmount"
                label={t`From Amount`}
                headers={headers}
                selectedHeaders={selectedHeaders}
            />
            <ImportColumnMapField control={control} name="comment" label={t`Comment`} headers={headers} selectedHeaders={selectedHeaders} />
            <ImportColumnMapField control={control} name="mcc" label={t`MCC`} headers={headers} selectedHeaders={selectedHeaders} />
            <ImportColumnMapField
                control={control}
                name="isPlanned"
                label={t`Is Planned`}
                headers={headers}
                selectedHeaders={selectedHeaders}
            />
        </CollapsibleChromePage>
    );
}
