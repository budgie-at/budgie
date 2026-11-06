import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
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
        <GroupedListActionRow
            label={t`Archive account`}
            icon={UserIconNameEnum.Archive}
            onPress={handleArchive}
            isDisabled={false}
            isLoading={isLoading}
            labelClassName="text-primary"
            testID={AccountDetailsSelector.ArchiveButton}
        />
    );
};
