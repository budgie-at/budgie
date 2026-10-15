import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useExportDatabaseAction } from '../../../export/hook/use-export-database-action.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsCard } from '../settings-card/settings-card';

interface Props {
    readonly testID: string;
}

export const YourDataExportCard = ({ testID }: Props) => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const { isLoading, handleExport } = useExportDatabaseAction();

    const description = isPinEnabled
        ? t`Sealed with your PIN. You choose where it goes.`
        : t`Not encrypted, because there's no PIN. You choose where it goes.`;

    return (
        <SettingsCard
            testID={testID}
            icon={UserIconNameEnum.Download}
            variant="cta"
            title={t`Export a backup`}
            description={description}
            isLoading={isLoading}
            onPress={handleExport}
        />
    );
};
