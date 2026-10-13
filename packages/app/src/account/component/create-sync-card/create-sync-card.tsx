import { ExternalSourceEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly bankProvider: ExternalSourceEnum;
}

export const CreateSyncCard = ({ title, description, bankProvider }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type: bankProvider } });

    return (
        <SimpleHorizontalCell
            testID={CreateAccountSelector.bankProvider(bankProvider)}
            size="lg"
            left={<BankLogo bankProvider={bankProvider} />}
            onPress={handleNavigate}
            title={title}
            description={description}
        />
    );
};
