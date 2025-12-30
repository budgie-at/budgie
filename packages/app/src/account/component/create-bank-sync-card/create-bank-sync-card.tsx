import { BankProviderEnum } from '@budgie/bank-sync';
import { Href, router } from 'expo-router';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

import type { IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly icon?: IconName;
    readonly description: string;
    readonly bankProvider: BankProviderEnum;
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
