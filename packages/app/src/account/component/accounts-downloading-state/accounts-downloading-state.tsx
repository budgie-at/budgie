import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { StateCard } from '../../../@generic/component/state-card/state-card';

interface Props {
    readonly fetchedRecordCount: number;
}

export const AccountsDownloadingState = ({ fetchedRecordCount }: Props) => {
    const { t } = useLingui();

    const itemsLabel = t({ message: plural(fetchedRecordCount, { one: '# item', other: '# items' }) });
    const description = fetchedRecordCount > 0 ? itemsLabel : <Trans>This can take a moment</Trans>;

    return (
        <StateCard
            icon={UserIconNameEnum.CloudDownload}
            title={<Trans>Downloading your data from iCloud…</Trans>}
            description={description}
        >
            <ActivityIndicator size="small" />
        </StateCard>
    );
};
