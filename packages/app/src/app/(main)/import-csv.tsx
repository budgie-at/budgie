import { YIELD_TO_UI } from '@budgie/contracts';
import {
    IMPORT_PRESETS,
    ImportColumnMapFormValues,
    ImportColumnMapSchema,
    ImporterColumnMapInterface,
    ImporterService,
    ImportPresetEnum
} from '@budgie/import-export';
import { useAtomSubscribe, useAtomValue } from '@effect/atom-react/Hooks';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MessageDescriptor } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Schema from 'effect/Schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import {
    BottomChromeInsetProvider,
    ScreenChromeFrame,
    ScreenChromeHeader,
    ScreenChromeFooter
} from '@rnw-community/react-native-screen-chrome';
import { getErrorMessage, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ImportScreenSelector } from '../(tabs)/settings/import-screen.selector';
import { Button } from '../../@generic/component/button/button';
import { GoBackButton } from '../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { ImportColumnMapField } from '../../import/components/import-column-map-field/import-column-map-field';
import { ImportPresetPicker } from '../../import/components/import-preset-picker/import-preset-picker';
import { ImportScreenScroll } from '../../import/components/import-screen-scroll/import-screen-scroll';
import { EMPTY_IMPORT_CSV } from '../../import/constant/empty-import-csv.constant';
import { importCsvAtom } from '../../import/constant/import-csv-atom.constant';
import { detectImportPreset } from '../../import/utils/detect-import-preset.util';
import { getImportMatchDescription } from '../../import/utils/get-import-match-description.util';
import { getImportRequiredFooter } from '../../import/utils/get-import-required-footer.util';
import { matchImportColumns } from '../../import/utils/match-import-columns.util';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';

const IMPORT_COLUMN_FIELDS = [
    { name: 'toAccount', label: msg`To account`, isRequired: true },
    { name: 'category', label: msg`Category`, isRequired: true },
    { name: 'operatedAt', label: msg`Date`, isRequired: true },
    { name: 'toAmount', label: msg`Amount`, isRequired: true },
    { name: 'toCurrency', label: msg`To currency`, isRequired: true },
    { name: 'externalId', label: msg`External ID`, isRequired: false },
    { name: 'fromAccount', label: msg`From account`, isRequired: false },
    { name: 'fromCurrency', label: msg`From currency`, isRequired: false },
    { name: 'fromAmount', label: msg`From amount`, isRequired: false },
    { name: 'comment', label: msg`Comment`, isRequired: false },
    { name: 'mcc', label: msg`MCC`, isRequired: false }
] as const satisfies readonly {
    readonly name: keyof ImportColumnMapFormValues;
    readonly label: MessageDescriptor;
    readonly isRequired: boolean;
}[];

const IMPORT_COLUMN_SECTIONS = [
    { title: msg`Required`, isRequired: true },
    { title: msg`Optional`, isRequired: false }
] as const;

// eslint-disable-next-line max-lines-per-function, max-statements
export default function ImportScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

    const { t } = useLingui();
    const headerStyle = useResolveClassNames('bg-surface');

    const csvAtom = importCsvAtom(isNotEmptyString(fileUri) ? fileUri : null);
    const importCsvResult = useAtomValue(csvAtom);
    const { csvText, headers, rowCount, samples } = AsyncResult.getOrElse(importCsvResult, () => EMPTY_IMPORT_CSV);
    const isReadingFile = AsyncResult.isWaiting(importCsvResult);
    const { isLoading: isImporting, run } = useSingleFlight();
    const isLoading = isReadingFile || isImporting;
    const processedFileUri = useRef<string | null>(null);
    const [detectedPreset, setDetectedPreset] = useState<ImportPresetEnum | undefined>();
    const [sampleMatchedColumns, setSampleMatchedColumns] = useState<Partial<ImportColumnMapFormValues>>({});
    const [selectedPreset, setSelectedPreset] = useState<ImportPresetEnum | undefined>();

    const headersSet = new Set(headers);

    const schemaWithHeaders = ImportColumnMapSchema.check(
        Schema.makeFilter(data =>
            IMPORT_COLUMN_FIELDS.filter(
                ({ isRequired, name }) => isRequired && !(isNotEmptyString(data[name]) && headersSet.has(data[name]))
            ).map(({ name }) => ({
                path: [name],
                issue: t`Select a valid column`
            }))
        )
    );

    const { control, handleSubmit, reset } = useForm<ImportColumnMapFormValues>({
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

    const handlePresetSelect = (preset: ImportPresetEnum | undefined) => {
        setSelectedPreset(preset);
        reset(isNotEmptyString(preset) ? IMPORT_PRESETS[preset] : matchImportColumns(headers, samples));
    };

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

    useAtomSubscribe(
        csvAtom,
        result => {
            if (AsyncResult.isSuccess(result) && isNotEmptyString(fileUri) && processedFileUri.current !== fileUri) {
                processedFileUri.current = fileUri;
                const detectedPreset = detectImportPreset(result.value.headers) ?? void 0;

                setDetectedPreset(detectedPreset);
                setSelectedPreset(detectedPreset);
                setSampleMatchedColumns({});

                if (isNotEmptyString(detectedPreset)) {
                    reset(IMPORT_PRESETS[detectedPreset]);
                } else {
                    const matchedByName = matchImportColumns(result.value.headers);
                    const matchedColumns = matchImportColumns(result.value.headers, result.value.samples);
                    setSampleMatchedColumns(
                        Object.fromEntries(
                            IMPORT_COLUMN_FIELDS.filter(
                                ({ name }) => isNotEmptyString(matchedColumns[name]) && !isNotEmptyString(matchedByName[name])
                            ).map(({ name }) => [name, matchedColumns[name]])
                        )
                    );
                    reset(matchedColumns);
                }
            }

            if (AsyncResult.isFailure(result)) {
                showErrorToast(t`Could not read CSV file`, getErrorMessage(Cause.squash(result.cause)));
                router.back();
            }
        },
        { immediate: true }
    );

    const handleGoBack = () => void router.back();

    const missingRequiredFields = IMPORT_COLUMN_FIELDS.filter(
        ({ isRequired, name }) => isRequired && !(isNotEmptyString(formValues[name]) && headersSet.has(formValues[name]))
    );
    const unmappedRequiredCount = missingRequiredFields.length;
    const isImportDisabled = isPositiveNumber(unmappedRequiredCount) || isLoading;
    const requiredFooter = getImportRequiredFooter(unmappedRequiredCount, t);
    const missingFieldLabels = missingRequiredFields.map(({ label }) => t(label)).join(', ');
    const accessibilityHint = isPositiveNumber(unmappedRequiredCount) ? t`Choose columns for ${missingFieldLabels}` : '';
    const buttonClassName = isImportDisabled ? 'bg-surface-fill border-transparent opacity-100' : '';
    const buttonLabelClassName = isImportDisabled
        ? 'text-secondary-foreground text-lg font-semibold text-center'
        : 'text-cta-foreground text-lg font-semibold text-center';
    const matchDescription = getImportMatchDescription(matchImportColumns(headers), sampleMatchedColumns, t);
    const buttonContent = t({ message: plural(rowCount, { one: 'Import # transaction', other: 'Import # transactions' }) });
    const buttonLabel = <Text className={buttonLabelClassName}>{buttonContent}</Text>;
    const rowCountDescription = t({ message: plural(rowCount, { one: '# row found', other: '# rows found' }) });

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider>
                <BottomChromeInsetProvider>
                    <ScreenChromeFrame>
                        <ImportScreenScroll>
                            <ImportPresetPicker
                                key={fileUri}
                                title={rowCountDescription}
                                detectedPreset={detectedPreset}
                                selectedPreset={selectedPreset}
                                onPresetSelect={handlePresetSelect}
                                hasMappedColumns={isPositiveNumber(selectedHeaders.length)}
                                matchDescription={matchDescription}
                            />
                            {IMPORT_COLUMN_SECTIONS.map(({ title, isRequired }) => {
                                const sectionFooter = isRequired ? requiredFooter : null;

                                return (
                                    <GroupedListSection key={String(isRequired)} title={t(title)} footer={sectionFooter}>
                                        {IMPORT_COLUMN_FIELDS.filter(field => field.isRequired === isRequired).map(({ name, label }) => (
                                            <ImportColumnMapField
                                                key={name}
                                                control={control}
                                                name={name}
                                                label={t(label)}
                                                headers={headers}
                                                samples={samples}
                                                selectedHeaders={selectedHeaders}
                                                isRequired={isRequired}
                                            />
                                        ))}
                                    </GroupedListSection>
                                );
                            })}
                        </ImportScreenScroll>
                        <ScreenChromeHeader style={headerStyle}>
                            <View className="absolute inset-0 items-center justify-center px-[60px]" pointerEvents="none">
                                <Text className="text-primary text-[17px] font-semibold" accessibilityRole="header">
                                    {t`Map CSV columns`}
                                </Text>
                            </View>
                            <GoBackButton onPress={handleGoBack} />
                        </ScreenChromeHeader>
                        <ScreenChromeFooter>
                            <View className="bg-surface border-t-hairline border-surface-separator px-5xl py-lg">
                                <Button
                                    content={buttonLabel}
                                    accessibilityLabel={buttonContent}
                                    accessibilityHint={accessibilityHint}
                                    variant="cta"
                                    className={buttonClassName}
                                    onPress={handleSubmit(handleStartImport)}
                                    size="lg"
                                    disabled={isImportDisabled}
                                    isLoading={isLoading}
                                    testID={ImportScreenSelector.StartImportButton}
                                />
                            </View>
                        </ScreenChromeFooter>
                    </ScreenChromeFrame>
                </BottomChromeInsetProvider>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
}
