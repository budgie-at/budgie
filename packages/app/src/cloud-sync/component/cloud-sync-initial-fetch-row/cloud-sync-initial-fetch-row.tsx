import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useCloudSyncInitialFetch } from '../../hook/use-cloud-sync-initial-fetch.hook';

export const CloudSyncInitialFetchRow = () => {
    const { t } = useLingui();
    const { fetchedRecordCount } = useCloudSyncInitialFetch();

    const itemsLabel = t({ message: plural(fetchedRecordCount, { one: '# item', other: '# items' }) });

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.CloudDownload} />}
            title={t`Bringing your data from iCloud…`}
            subtitle={itemsLabel}
            right={<ActivityIndicator size="small" />}
        />
    );
};
