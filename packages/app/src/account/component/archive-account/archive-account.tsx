import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';

interface Props {
    readonly accountId: number;
}

export const ArchiveAccount = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { handleArchive, isLoading, isArchivable, isShareLoading, isBrokerageCash } = useArchiveAccount(
        accountId,
        () => void dismissAllOrReplace('/')
    );
    const label = isBrokerageCash ? t`Archive brokerage` : t`Archive account`;

    return isArchivable || isShareLoading ? (
        <LoadingContent isLoading={isShareLoading}>
            <GroupedListActionRow
                label={label}
                icon={UserIconNameEnum.Archive}
                onPress={handleArchive}
                isDisabled={false}
                isLoading={isLoading}
                labelClassName="text-primary"
                testID={AccountDetailsSelector.ArchiveButton}
            />
        </LoadingContent>
    ) : null;
};
