import { useLocalSearchParams } from 'expo-router';

import { CreateEnableBankingAccount } from '../../../../../sync/component/create-enable-banking-account/create-enable-banking-account';

export default function CreateAccountBank() {
    const { country, name } = useLocalSearchParams<{ country: string; name: string }>();

    return (
        <CreateEnableBankingAccount
            connectAccountId={null}
            savedApplicationId={null}
            preselectedBankName={name}
            preselectedCountry={country}
        />
    );
}
