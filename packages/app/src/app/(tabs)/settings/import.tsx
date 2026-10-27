import { UserIconNameEnum, YIELD_TO_UI } from '@budgie/contracts';
import {
    countCsvRows,
    IMPORT_PRESETS,
    ImportColumnMapFormValues,
    ImportColumnMapSchema,
    ImporterColumnMapInterface,
    ImporterService,
    ImportPresetEnum,
    parseCsvHeaders
} from '@budgie/import-export';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
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
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { ImportColumnMapField } from '../../../import/components/import-column-map-field/import-column-map-field';
import { ImportPresetPicker } from '../../../import/components/import-preset-picker/import-preset-picker';
import { RuleApplicationDrainerService } from '../../../rule/service/rule-application-drainer.service';

import { ImportScreenSelector } from './import-screen.selector';

const IMPORT_COLUMN_FIELDS = [
    { name: 'toAccount', label: msg`To Account`, isRequired: true },
    { name: 'category', label: msg`Category`, isRequired: true },
    { name: 'operatedAt', label: msg`Date`, isRequired: true },
    { name: 'toAmount', label: msg`Amount`, isRequired: true },
    { name: 'toCurrency', label: msg`To Currency`, isRequired: true },
    { name: 'externalId', label: msg`External ID`, isRequired: false },
    { name: 'fromAccount', label: msg`From Account`, isRequired: false },
    { name: 'fromCurrency', label: msg`From Currency`, isRequired: false },
    { name: 'fromAmount', label: msg`From Amount`, isRequired: false },
    { name: 'comment', label: msg`Comment`, isRequired: false },
    { name: 'mcc', label: msg`MCC`, isRequired: false }
] as const satisfies readonly {
    readonly name: keyof ImportColumnMapFormValues;
    readonly label: MessageDescriptor;
    readonly isRequired: boolean;
}[];

// eslint-disable-next-line max-lines-per-function, max-statements
export default function ImportScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

    const { t } = useLingui();

    const [csvText, setCsvText] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [isReadingFile, setIsReadingFile] = useState(false);
    const { isLoading: isImporting, run } = useSingleFlight();
    const isLoading = isReadingFile || isImporting;
    const [selectedPreset, setSelectedPreset] = useState<ImportPresetEnum | undefined>();

    const headersSet = new Set(headers);

    const schemaWithHeaders = ImportColumnMapSchema.check(
        Schema.makeFilter(data =>
            IMPORT_COLUMN_FIELDS.filter(({ isRequired, name }) => isRequired && !headersSet.has(data[name])).map(({ name }) => ({
                path: [name],
                issue: t`Select a valid column`
            }))
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
                setIsReadingFile(true);
                const text = yield* Effect.promise(() => new File(fileUri).text());
                const [parsedHeaders, count] = yield* Effect.all([parseCsvHeaders(text), countCsvRows(text)]);

                setCsvText(text);
                setHeaders(parsedHeaders);
                setRowCount(count);
            }).pipe(
                Effect.catchCause(cause =>
                    Effect.sync(() => {
                        showErrorToast(t`Could not read CSV file`, getErrorMessage(Cause.squash(cause)));
                        router.back();
                    })
                ),
                Effect.ensuring(Effect.sync(() => void setIsReadingFile(false)))
            )
        );
    }, [fileUri, t]);

    const handleStartImport = (columnMap: ImporterColumnMapInterface) =>
        run(
            Effect.gen(function* () {
                const importerService = yield* ImporterService;
                const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;

                yield* YIELD_TO_UI;
                const { transactionIds, transactions } = yield* importerService.replaceAll(columnMap, csvText);
                yield* ruleApplicationDrainerService.enqueueTransactions(transactionIds, transactions);

                router.back();
            }).pipe(toastOnFailure(t`Could not import CSV file`))
        );
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
            {IMPORT_COLUMN_FIELDS.map(({ name, label, isRequired }) => (
                <ImportColumnMapField
                    key={name}
                    control={control}
                    name={name}
                    label={t(label)}
                    headers={headers}
                    selectedHeaders={selectedHeaders}
                    isRequired={isRequired}
                />
            ))}
        </CollapsibleChromePage>
    );
}
