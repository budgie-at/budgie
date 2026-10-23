import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

import { ImportCsvSelector } from './import-csv.selector';

export const ImportCsv = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();

    const handleSelectAndNavigate = () =>
        run(async () => {
            try {
                const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
                const { uri } = result.assets?.at(0) ?? {};

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                router.push({ pathname: '/settings/import', params: { fileUri: uri } });
            } catch (error) {
                Toast.show({ type: 'error', text1: t`Could not select CSV file`, text2: getErrorMessage(error) });
            }
        });

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
