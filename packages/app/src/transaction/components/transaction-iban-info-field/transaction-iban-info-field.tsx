import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useGetAccountByIbanQuery } from '../../../account/query/use-get-account-by-iban.query';
import { IBAN_SUFFIX_LENGTH } from '../constant/iban-suffix-length.constant';

interface Props {
    readonly toIban: string | null | undefined;
}

export const TransactionIbanInfoField = ({ toIban }: Props) => {
    const { account } = useGetAccountByIbanQuery(toIban);

    if (!isNotEmptyString(toIban)) {
        return null;
    }

    if (isDefined(account)) {
        const { title } = account;

        return (
            <View className="px-lg py-xs rounded-full bg-primary/10 border border-secondary-corner self-center mb-md">
                <Text className="text-xxs font-medium text-secondary-foreground">{t`→ ${title}`}</Text>
            </View>
        );
    }

    const suffix = toIban.slice(IBAN_SUFFIX_LENGTH);

    return (
        <View className="px-lg py-xs rounded-full bg-primary/10 border border-secondary-corner self-center mb-md">
            <Text className="text-xxs font-medium text-secondary-foreground">{t`IBAN: ...${suffix}`}</Text>
        </View>
    );
};
