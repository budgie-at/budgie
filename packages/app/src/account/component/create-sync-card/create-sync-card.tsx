import { ExternalSourceEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly bankProvider: ExternalSourceEnum;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CreateSyncCard = ({ title, description, bankProvider }: Props) => {
    const handleNavigate = () => void router.push({ pathname: '/create-account/[type]', params: { type: bankProvider } });

    return (
        <GroupedListRow
            testID={CreateAccountSelector.bankProvider(bankProvider)}
            left={
                <View
                    className="h-[36px] w-[36px] overflow-hidden rounded-[10px] border-hairline border-surface-separator"
                    style={CONTINUOUS_CORNERS}
                >
                    <BankLogo bankProvider={bankProvider} size={36} />
                </View>
            }
            title={title}
            subtitle={description}
            onPress={handleNavigate}
        />
    );
};
