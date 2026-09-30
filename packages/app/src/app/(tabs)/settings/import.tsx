import {
    AccountBalanceRepository,
    AccountRepository,
    CategoryRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionTagsRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, Text, View } from 'react-native';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { YIELD_TO_UI } from '../../../@generic/constant/yield-to-ui.constant';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { AccountBalanceIncrementalService } from '../../../account/service/account-balance-incremental.service';
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

    const schemaWithHeaders = ImportColumnMapSchema.check(
        Schema.makeFilter(data =>
            (['toAccount', 'category', 'operatedAt', 'toAmount', 'toCurrency'] as const)
                .filter(column => !headersSet.has(data[column]))
                .map(column => ({ path: [column], issue: t`Select a valid column` }))
        )
    );

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ImportColumnMapFormValues>({
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(schemaWithHeaders)),
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
        if (!isNotEmptyString(fileUri)) {
            return;
        }

        appRuntime.runFork(
            Effect.gen(function* () {
                setIsLoading(true);
                const text = yield* Effect.tryPromise(() => new File(fileUri).text());
                const [parsedHeaders, count] = yield* Effect.all([parseCsvHeaders(text), countCsvRows(text)]);

                setCsvText(text);
                setHeaders(parsedHeaders);
                setRowCount(count);
            }).pipe(
                Effect.catch(error =>
                    Effect.sync(() => {
                        showErrorToast(t`Could not read CSV file`, getErrorMessage(error));
                        router.back();
                    })
                ),
                Effect.ensuring(Effect.sync(() => void setIsLoading(false)))
            )
        );
    }, [fileUri, t]);

    const handleStartImport = (columnMap: ImporterColumnMapInterface) => {
        setIsLoading(true);

        return appRuntime.runPromise(
            Effect.gen(function* () {
                const accountRepository = yield* AccountRepository;
                const categoryRepository = yield* CategoryRepository;
                const transactionTagsRepository = yield* TransactionTagsRepository;
                const transactionEntryRepository = yield* TransactionEntryRepository;
                const transactionRepository = yield* TransactionRepository;
                const accountBalanceRepository = yield* AccountBalanceRepository;
                const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

                yield* YIELD_TO_UI;
                yield* Effect.all(
                    [
                        accountRepository.truncate(),
                        categoryRepository.truncate(false),
                        transactionTagsRepository.truncate(),
                        transactionEntryRepository.truncate(),
                        transactionRepository.truncate(),
                        accountBalanceRepository.truncate()
                    ],
                    { discard: true }
                );
                yield* Effect.flatMap(ImporterService, importerService => importerService.process(columnMap, csvText, rowCount));
                yield* accountBalanceIncrementalService.updateAllBalances(true);

                router.back();
            }).pipe(
                Effect.catch(error => Effect.sync(() => void showErrorToast(t`Could not import CSV file`, getErrorMessage(error)))),
                Effect.ensuring(Effect.sync(() => void setIsLoading(false)))
            )
        );
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
                <View className="flex-row gap-x-md px-5xl">
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
