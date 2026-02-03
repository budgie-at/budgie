import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { Href, router } from 'expo-router';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly title: string;
    readonly icon?: UserIconNameEnum;
    readonly description: string;
    readonly bankProvider: ExternalSourceEnum;
    readonly route: Href;
}

export const CreateBankSyncCard = ({ title, description, route, bankProvider }: Props) => {
    const handleNavigate = () => void router.push(route);

    return (
        <SimpleHorizontalCell
            size="lg"
            left={<BankLogo bankProvider={bankProvider} />}
            onPress={handleNavigate}
            title={title}
            description={description}
        />
    );
};
