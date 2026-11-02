import { UserIconNameEnum, YIELD_TO_UI } from '@budgie/contracts';
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

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ImportScreenSelector } from '../(tabs)/settings/import-screen.selector';
import { Button } from '../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../@generic/component/grouped-list-section/grouped-list-section';
import { MenuSpacer } from '../../@generic/component/menu-spacer/menu-spacer';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { ImportColumnMapField } from '../../import/components/import-column-map-field/import-column-map-field';
import { ImportPresetPicker } from '../../import/components/import-preset-picker/import-preset-picker';
import { EMPTY_IMPORT_CSV } from '../../import/constant/empty-import-csv.constant';
import { importCsvAtom } from '../../import/constant/import-csv-atom.constant';
import { detectImportPreset } from '../../import/utils/detect-import-preset.util';
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

// eslint-disable-next-line max-lines-per-function, max-statements
export default function ImportScreen() {
    const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

    const { t } = useLingui();

    const csvAtom = importCsvAtom(isNotEmptyString(fileUri) ? fileUri : null);
    const importCsvResult = useAtomValue(csvAtom);
    const { csvText, headers, rowCount } = AsyncResult.getOrElse(importCsvResult, () => EMPTY_IMPORT_CSV);
    const isReadingFile = AsyncResult.isWaiting(importCsvResult);
    const { isLoading: isImporting, run } = useSingleFlight();
    const isLoading = isReadingFile || isImporting;
    const hasDetectedPreset = useRef(false);
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
                    handlePresetSelect(detectedPreset);
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

    const hasErrors = isNotEmptyArray(Object.keys(errors));
    const buttonContent = hasErrors
        ? t`Fix errors`
        : t({ message: plural(rowCount, { one: 'Import # transaction', other: 'Import # transactions' }) });
    const rowCountDescription = t({ message: plural(rowCount, { one: '# row found', other: '# rows found' }) });

    return (
        <CollapsibleChromePage
            title={t`Map CSV columns`}
            subtitle={rowCountDescription}
            leading={<GoBackButton onPress={handleGoBack} />}
            contentClassName="gap-y-7xl"
            footer={
                <View className="px-5xl py-lg">
                    <Button
                        content={buttonContent}
                        variant="primary"
                        onPress={handleSubmit(handleStartImport)}
                        leftIcon={UserIconNameEnum.Database}
                        isLoading={isLoading}
                        testID={ImportScreenSelector.StartImportButton}
                    />
                </View>
            }
        >
            <ImportPresetPicker selectedPreset={selectedPreset} onPresetSelect={handlePresetSelect} />
            <GroupedListSection title={t`Required`}>
                {IMPORT_COLUMN_FIELDS.filter(field => field.isRequired).map(({ name, label, isRequired }) => (
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
            </GroupedListSection>
            <GroupedListSection title={t`Optional`}>
                {IMPORT_COLUMN_FIELDS.filter(field => !field.isRequired).map(({ name, label, isRequired }) => (
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
            </GroupedListSection>
            <MenuSpacer />
        </CollapsibleChromePage>
    );
}
