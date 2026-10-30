import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';
import { CategorizeInboxPrimaryBar } from '../categorize-inbox-primary-bar/categorize-inbox-primary-bar';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly account: Pick<AccountEntityInterface, 'id' | 'title'>;
}

export const CategorizeInboxGroupLearnedTransferBar = ({ cluster, account }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { includedRows, transferCluster } = useCategorizeInboxContext();

    const handlePress = (): void => {
        transferCluster(cluster, account.id, account.title, true);
        router.dismissTo('/categorize');
    };

    const count = includedRows(cluster).length;
    const { title } = account;

    return (
        <CategorizeInboxPrimaryBar
            label={t`Transfer ${count} to ${title}`}
            testID={CategorizeInboxGroupScreenSelector.PrimaryButton}
            onPress={handlePress}
        />
    );
};
