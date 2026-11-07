import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { cloudRestoreFailureAtom } from '../../constant/cloud-restore-failure-atom.constant';
import { CLOUD_RESTORE_FAILURE_MESSAGE } from '../../constant/cloud-restore-failure-message.constant';
import { useCloudRestoreContext } from '../../context/cloud-restore.context';
import { CloudRestoreFailureEnum } from '../../enum/cloud-restore-failure.enum';
import { useFormatCloudBackupDate } from '../../hook/use-format-cloud-backup-date.hook';

import { CloudBackupRowSelector } from './cloud-backup-row.selector';

interface Props {
    readonly recordName: string;
    readonly createdAt: Date;
    readonly appVersion: string;
}

export const CloudBackupRow = ({ recordName, createdAt, appVersion }: Props) => {
    const { t } = useLingui();
    const { restore, isLoading } = useCloudRestoreContext();
    const failure = useAtomValue(cloudRestoreFailureAtom, failures => failures[recordName] ?? null);
    const formatBackupDate = useFormatCloudBackupDate();

    const handlePress = () => void restore(recordName);

    const isUnreadable = failure === CloudRestoreFailureEnum.UNREADABLE;
    const icon = isUnreadable ? UserIconNameEnum.CloudAlert : UserIconNameEnum.CloudDownload;
    const title = formatBackupDate(createdAt);
    const subtitle = isDefined(failure) ? t(CLOUD_RESTORE_FAILURE_MESSAGE[failure]) : t`Budgie ${appVersion}`;
    const pressableProps = { disabled: isLoading };
    const retryButton =
        failure === CloudRestoreFailureEnum.KEYCHAIN_UNAVAILABLE ? (
            <SettingsPillButton
                label={t`Try again`}
                variant="secondary"
                size="sm"
                onPress={handlePress}
                isDisabled={isLoading}
                testID={CloudBackupRowSelector.RetryButton(recordName)}
            />
        ) : null;

    return (
        <GroupedListRow
            testID={CloudBackupRowSelector.Root(recordName)}
            left={<GroupedListIcon icon={icon} />}
            title={title}
            subtitle={subtitle}
            right={retryButton}
            pressableProps={pressableProps}
            {...(!isUnreadable && { onPress: handlePress })}
        />
    );
};
