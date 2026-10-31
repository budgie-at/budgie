import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { handleArchive, isLoading } = useArchiveAccount(accountId, () => void dismissAllOrReplace('/'));

    return (
        <GroupedListRow
            title={t`Archive account`}
            {...(isLoading && { right: <ActivityIndicator /> })}
            testID={AccountDetailsSelector.ArchiveButton}
            onPress={handleArchive}
        />
    );
};
