import { BankProviderEnum } from '@budgie/bank-sync';
import { Href, router } from 'expo-router';

import { BankLogo } from '../../../@generic/components/bank-logo/bank-logo';
import { Card } from '../../../@generic/components/card/card';
import { AccountCardContent } from '../account-card-content/account-card-content';

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
        <Card className="p-5xl items-center flex-row gap-x-3xl active:scale-xs" onPress={handleNavigate}>
            <BankLogo bankProvider={bankProvider} />

            <AccountCardContent title={title} description={description} />
        </Card>
    );
};
