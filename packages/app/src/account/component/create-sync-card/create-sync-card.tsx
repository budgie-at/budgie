import { ExternalSourceEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly bankProvider: ExternalSourceEnum;
}

export const CreateSyncCard = ({ title, description, bankProvider }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type: bankProvider } });

    return (
        <GroupedListRow
            testID={CreateAccountSelector.bankProvider(bankProvider)}
            left={<BankLogo bankProvider={bankProvider} size={36} />}
            title={title}
            subtitle={description}
            onPress={handleNavigate}
        />
    );
};
