import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';

import { isNotEmptyString } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

import { ImportCsvSelector } from './import-csv.selector';

export const ImportCsv = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();

    const handleSelectAndNavigate = () =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.promise(() =>
                    DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true })
                );
                const { uri } = result.assets?.at(0) ?? {};

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                router.push({ pathname: '/settings/import', params: { fileUri: uri } });
            }).pipe(toastOnFailure(t`Could not select CSV file`))
        );

    const handlePress = () => void handleSelectAndNavigate();

    return (
        <SettingsRow
            title={t`Import CSV`}
            subtitle={t`Add transactions from a spreadsheet`}
            {...(!isLoading && { onPress: handlePress })}
            icon={UserIconNameEnum.Download}
            variant="ghost"
            right={<SettingsRowAccessory isLoading={isLoading} />}
            testID={ImportCsvSelector.ImportCard}
        />
    );
};
