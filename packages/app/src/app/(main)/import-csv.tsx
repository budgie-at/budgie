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
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ImportScreenSelector } from '../(tabs)/settings/import-screen.selector';
import { Button } from '../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { MenuSpacer } from '../../@generic/component/menu-spacer/menu-spacer';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { ImportColumnMapField } from '../../import/components/import-column-map-field/import-column-map-field';
import { ImportPresetPicker } from '../../import/components/import-preset-picker/import-preset-picker';
import { EMPTY_IMPORT_CSV } from '../../import/constant/empty-import-csv.constant';
import { importCsvAtom } from '../../import/constant/import-csv-atom.constant';
import { detectImportPreset } from '../../import/utils/detect-import-preset.util';
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
    const { bottom } = useSafeAreaInsets();

    const csvAtom = importCsvAtom(isNotEmptyString(fileUri) ? fileUri : null);
    const importCsvResult = useAtomValue(csvAtom);
    const { csvText, headers, rowCount, samples } = AsyncResult.getOrElse(importCsvResult, () => EMPTY_IMPORT_CSV);
    const isReadingFile = AsyncResult.isWaiting(importCsvResult);
    const { isLoading: isImporting, run } = useSingleFlight();
    const isLoading = isReadingFile || isImporting;
    const hasDetectedPreset = useRef(false);
    const [detectedPreset, setDetectedPreset] = useState<ImportPresetEnum | undefined>();
    const [hasMatchedColumns, setHasMatchedColumns] = useState(false);
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

    const handlePresetSelect = (preset: ImportPresetEnum) => {
        setSelectedPreset(preset);
        reset(IMPORT_PRESETS[preset]);
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
            if (AsyncResult.isSuccess(result) && !hasDetectedPreset.current) {
                hasDetectedPreset.current = true;
                const detectedPreset = detectImportPreset(result.value.headers);

                if (isNotEmptyString(detectedPreset)) {
                    setDetectedPreset(detectedPreset);
                    handlePresetSelect(detectedPreset);
                } else {
                    const matchedColumns = matchImportColumns(result.value.headers);
                    reset(matchedColumns);
                    setHasMatchedColumns(Object.values(matchedColumns).some(isNotEmptyString));
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

    const unmappedRequiredCount = IMPORT_COLUMN_FIELDS.filter(
        ({ isRequired, name }) => isRequired && !headersSet.has(formValues[name] ?? '')
    ).length;
    const isImportDisabled = isPositiveNumber(unmappedRequiredCount) || isLoading;
    const requiredFooter = hasMatchedColumns ? t`Matched by column name. Tap a field to change it.` : t`Pick a column for each field.`;
    const buttonVariant = isPositiveNumber(unmappedRequiredCount) ? 'secondary' : 'cta';
    const buttonClassName = isPositiveNumber(unmappedRequiredCount) ? 'bg-surface-fill border-transparent' : '';
    const footerStyle = { marginBottom: -bottom, paddingBottom: bottom + 12 };
    const buttonContent = isPositiveNumber(unmappedRequiredCount)
        ? t({ message: plural(unmappedRequiredCount, { one: 'Match # required field', other: 'Match # required fields' }) })
        : t({ message: plural(rowCount, { one: 'Import # transaction', other: 'Import # transactions' }) });
    const rowCountDescription = t({ message: plural(rowCount, { one: '# row found', other: '# rows found' }) });

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                scrimClassName="bg-surface"
                title={t`Map CSV columns`}
                subtitle={rowCountDescription}
                leading={<GoBackButton onPress={handleGoBack} />}
                contentClassName="gap-y-7xl"
                footer={
                    <View className="bg-surface border-t-hairline border-surface-separator px-5xl pt-lg" style={footerStyle}>
                        <Button
                            content={buttonContent}
                            variant={buttonVariant}
                            className={buttonClassName}
                            onPress={handleSubmit(handleStartImport)}
                            size="lg"
                            disabled={isImportDisabled}
                            isLoading={isLoading}
                            testID={ImportScreenSelector.StartImportButton}
                        />
                    </View>
                }
            >
                <ImportPresetPicker detectedPreset={detectedPreset} selectedPreset={selectedPreset} onPresetSelect={handlePresetSelect} />
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
                <MenuSpacer />
            </CollapsibleChromePage>
        </GroupedSurface>
    );
}
