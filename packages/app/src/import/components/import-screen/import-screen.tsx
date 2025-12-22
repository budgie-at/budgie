import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Page } from '../../../@generic/components/page/page';
import { ICONS } from '../../../@generic/constant/icons.constant';
import {
    accountBalanceRepository,
    accountRepository,
    categoryRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../../@generic/drizzle/db/db';
import { microPause } from '../../../@generic/utils/micro-pause.util';
import { accountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
import { ImporterColumnMapInterface } from '../../interface/importer-column-map.interface';
import { ImportColumnMapFormValues, ImportColumnMapSchema } from '../../schema/import-column-map.schema';
import { ImporterService } from '../../service/importer.service';
import { countCsvRows, parseCsvHeaders } from '../../util/csv-parser.util';
import { ImportColumnMapField } from '../import-column-map-field/import-column-map-field';

import type { Edge } from 'react-native-safe-area-context';

// HINT: SmartBudget2 columns
const DEFAULT_VALUES: ImportColumnMapFormValues = {
    // eslint-disable-next-line lingui/no-unlocalized-strings
    externalId: 'Порядковый номер',
    fromAccount: 'Счёт_1',
    toAccount: 'Счёт',
    category: 'Категория',
    operatedAt: 'Дата',
    comment: 'Описание',
    amount: 'Сумма',
    toCurrency: 'Валюта',
    // eslint-disable-next-line lingui/no-unlocalized-strings
    fromCurrency: 'Валюта 2'
};

const SAFE_EDGES: Edge[] = ['bottom'];

// eslint-disable-next-line max-lines-per-function
export const ImportScreen = () => {
    const { fileUri } = useLocalSearchParams<{ fileUri: string }>();

    const { t } = useLingui();

    const [csvText, setCsvText] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const headersSet = new Set(headers);

    const schemaWithHeaders = ImportColumnMapSchema.refine(data => headersSet.has(data.toAccount), {
        message: t`Select a valid column`,
        path: ['toAccount']
    })
        .refine(data => headersSet.has(data.category), { message: t`Select a valid column`, path: ['category'] })
        .refine(data => headersSet.has(data.operatedAt), { message: t`Select a valid column`, path: ['operatedAt'] })
        .refine(data => headersSet.has(data.amount), { message: t`Select a valid column`, path: ['amount'] })
        .refine(data => headersSet.has(data.toCurrency), { message: t`Select a valid column`, path: ['toCurrency'] });

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<ImportColumnMapFormValues>({
        resolver: zodResolver(schemaWithHeaders),
        defaultValues: DEFAULT_VALUES,
        mode: 'onSubmit'
    });

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
            } catch (error) {
                Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
                router.back();
            }
        };

        void loadFile();
    }, [fileUri, t]);

    // eslint-disable-next-line max-statements
    const handleStartImport = async (columnMap: ImporterColumnMapInterface) => {
        setIsLoading(true);

        await microPause();

        const importer = new ImporterService(columnMap);

        try {
            await accountRepository.truncate();
            await categoryRepository.truncate();
            await transactionTagsRepository.truncate();
            await transactionEntryRepository.truncate();
            await transactionRepository.truncate();
            await accountBalanceRepository.truncate();

            const finalProgress = await importer.process(csvText, rowCount);

            const hasErrors = finalProgress.errors > 0;
            const successCount = finalProgress.successful;
            const errorCount = finalProgress.errors;

            Toast.show({
                type: hasErrors ? 'info' : 'success',
                text1: t`Import Complete`,
                text2: hasErrors ? t`${successCount} imported, ${errorCount} failed` : t`${successCount} transactions imported`
            });

            await accountBalanceIncrementalService.updateAllBalances();

            router.back();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Import Failed`, text2: getErrorMessage(error) });
        }

        setIsLoading(false);
    };
    const handleCancel = () => void router.back();

    const hasErrors = Object.keys(errors).length > 0;
    const buttonContent = hasErrors ? t`Fix Errors` : t`Start Import`;

    return (
        <Page safeEdges={SAFE_EDGES}>
            <View className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="gap-y-xl pb-5xl pt-3xl">
                    <View className="items-center gap-y-md pb-xl">
                        <CircleIcon icon={ICONS.FileText} variant="default" size="2xl" />
                        <Text className="text-primary text-xl font-semibold">{t`Map CSV Columns`}</Text>
                        <Text className="text-secondary-foreground text-sm text-center">{t`Match each field to a column from your CSV file`}</Text>
                        <View className="bg-secondary-background px-3xl py-md rounded-full">
                            <Text className="text-primary text-sm font-medium">{t`${rowCount} rows found`}</Text>
                        </View>
                    </View>

                    <ImportColumnMapField control={control} name="toAccount" label={t`To Account`} headers={headers} isRequired />
                    <ImportColumnMapField control={control} name="category" label={t`Category`} headers={headers} isRequired />
                    <ImportColumnMapField control={control} name="operatedAt" label={t`Date`} headers={headers} isRequired />
                    <ImportColumnMapField control={control} name="amount" label={t`Amount`} headers={headers} isRequired />
                    <ImportColumnMapField control={control} name="toCurrency" label={t`To Currency`} headers={headers} isRequired />
                    <ImportColumnMapField control={control} name="externalId" label={t`External ID`} headers={headers} />
                    <ImportColumnMapField control={control} name="fromAccount" label={t`From Account`} headers={headers} />
                    <ImportColumnMapField control={control} name="fromCurrency" label={t`From Currency`} headers={headers} />
                    <ImportColumnMapField control={control} name="comment" label={t`Comment`} headers={headers} />
                </ScrollView>

                <View className="pt-xl pb-xl flex-row gap-x-md">
                    <View className="flex-1">
                        <Button content={t`Cancel`} variant="ghost" onPress={handleCancel} />
                    </View>
                    <View className="flex-2 align-middle justify-center ">
                        {isLoading ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <Button
                                content={buttonContent}
                                variant="positive"
                                onPress={handleSubmit(handleStartImport)}
                                leftIcon="Database"
                            />
                        )}
                    </View>
                </View>
            </View>
        </Page>
    );
};
