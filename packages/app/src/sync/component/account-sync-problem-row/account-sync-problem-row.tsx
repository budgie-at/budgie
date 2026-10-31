import { SyncEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { SYNC_ERROR_LABEL } from '../../constant/sync-error-label.constant';
import { useResyncWindowPickerModal } from '../../context/resync-window-picker-modal.context';
import { hasSyncProblem } from '../../utils/has-sync-problem.util';
import { AccountSyncCardSelector } from '../account-sync-card/account-sync-card.selector';

interface Props {
    readonly sync: Pick<SyncEntityInterface, 'accountId' | 'enabled' | 'lastError' | 'lastErrorCode' | 'lastWarning'>;
}

export const AccountSyncProblemRow = ({ sync }: Props) => {
    const { t } = useLingui();
    const [openResyncWindowPicker] = useResyncWindowPickerModal();

    const handleRetry = () => {
        openResyncWindowPicker({ accountId: sync.accountId });
    };

    if (!sync.enabled || !hasSyncProblem(sync)) {
        return null;
    }

    const message = isDefined(sync.lastErrorCode) ? t(SYNC_ERROR_LABEL[sync.lastErrorCode]) : t`Tap to retry`;

    return (
        <GroupedListRow
            left={
                <CircleIcon
                    icon={UserIconNameEnum.TriangleAlert}
                    variant="destructive"
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                />
            }
            title={t`Sync stopped`}
            subtitle={
                <Text
                    className="text-secondary-foreground text-[13px] leading-[18px]"
                    numberOfLines={2}
                    testID={AccountSyncCardSelector.LastError}
                >
                    {message}
                </Text>
            }
            onPress={handleRetry}
        />
    );
};
