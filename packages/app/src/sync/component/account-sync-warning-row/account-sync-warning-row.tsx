import { SyncErrorCodeEnum, SyncWarningEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { SYNC_ERROR_LABEL } from '../../constant/sync-error-label.constant';
import { AccountSyncCardSelector } from '../account-sync-card/account-sync-card.selector';

interface Props {
    readonly warning: SyncWarningEnum;
}

export const AccountSyncWarningRow = ({ warning }: Props) => {
    const { t } = useLingui();

    const warningLabels: Record<SyncWarningEnum, string> = {
        [SyncWarningEnum.C2C_UNAVAILABLE]: t`Binance P2P orders are unavailable: the API key is missing P2P read permission.`,
        [SyncWarningEnum.REGION_UNAVAILABLE]: t(SYNC_ERROR_LABEL[SyncErrorCodeEnum.REGION_UNAVAILABLE])
    };

    return (
        <GroupedListRow
            left={<CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="warning" size={36} iconSize={18} radius={18} border={false} />}
            title={t`Warning`}
            subtitle={
                <Text
                    className="text-secondary-foreground text-[13px] leading-[18px]"
                    numberOfLines={3}
                    testID={AccountSyncCardSelector.Warning}
                >
                    {warningLabels[warning]}
                </Text>
            }
        />
    );
};
