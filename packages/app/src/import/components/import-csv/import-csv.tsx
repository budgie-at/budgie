import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';

import { isNotEmptyString } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

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

    return (
        <SettingsCard
            title={t`Import CSV`}
            description={t`Import transactions from a CSV file`}
            onPress={handleSelectAndNavigate}
            icon={UserIconNameEnum.Upload}
            variant="warning"
            isLoading={isLoading}
            testID={ImportCsvSelector.ImportCard}
        />
    );
};
