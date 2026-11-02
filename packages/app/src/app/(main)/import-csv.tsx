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
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Schema from 'effect/Schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { BottomChromeInsetProvider, ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { getErrorMessage, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { ImportColumnMapField } from '../../import/components/import-column-map-field/import-column-map-field';
import { ImportPresetPicker } from '../../import/components/import-preset-picker/import-preset-picker';
import { ImportScreenFooter } from '../../import/components/import-screen-footer/import-screen-footer';
import { ImportScreenHeader } from '../../import/components/import-screen-header/import-screen-header';
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
] as const;

const IMPORT_COLUMN_SECTIONS = [
    { title: msg`Required`, isRequired: true },
    { title: msg`Optional`, isRequired: false }
] as const;

// eslint-disable-next-line max-lines-per-function, max-statements
export default function ImportScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

    const { t } = useLingui();

    const csvAtom = importCsvAtom(isNotEmptyString(fileUri) ? fileUri : null);
    const importCsvResult = useAtomValue(csvAtom);
    const { csvText, headers, rowCount, samples } = AsyncResult.getOrElse(importCsvResult, () => EMPTY_IMPORT_CSV);
    const isReadingFile = AsyncResult.isWaiting(importCsvResult);
    const { isLoading: isImporting, run } = useSingleFlight();
    const isLoading = isReadingFile || isImporting;
    const processedFileUri = useRef<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<ImportPresetEnum | undefined>();

    const headersSet = new Set(headers);
    const detectedPreset = detectImportPreset(headers) ?? void 0;
    const matchedByName = matchImportColumns(headers);
    const matchedColumns = matchImportColumns(headers, samples);
    const sampleMatchedColumns = Object.fromEntries(
        IMPORT_COLUMN_FIELDS.filter(
            ({ name }) =>
                !isNotEmptyString(detectedPreset) && isNotEmptyString(matchedColumns[name]) && !isNotEmptyString(matchedByName[name])
        ).map(({ name }) => [name, matchedColumns[name]])
    );

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
        defaultValues: matchImportColumns([]),
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

                setSelectedPreset(detectedPreset);

                if (isNotEmptyString(detectedPreset)) {
                    reset(IMPORT_PRESETS[detectedPreset]);
                } else {
                    reset(matchImportColumns(result.value.headers, result.value.samples));
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
    const matchDescription = getImportMatchDescription(matchedByName, sampleMatchedColumns, t);
    const buttonContent = t({ message: plural(rowCount, { one: 'Import # transaction', other: 'Import # transactions' }) });

    return (
        <GroupedSurface>
            <ScreenChromeThemeProvider>
                <BottomChromeInsetProvider>
                    <ScreenChromeFrame>
                        <ImportScreenScroll>
                            <ImportPresetPicker
                                key={fileUri}
                                rowCount={rowCount}
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
                        <ImportScreenHeader onGoBack={handleGoBack} />
                        <ImportScreenFooter
                            buttonContent={buttonContent}
                            accessibilityHint={accessibilityHint}
                            onImport={handleSubmit(handleStartImport)}
                            isDisabled={isImportDisabled}
                            isLoading={isLoading}
                            missingRequiredCount={unmappedRequiredCount}
                        />
                    </ScreenChromeFrame>
                </BottomChromeInsetProvider>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
}
