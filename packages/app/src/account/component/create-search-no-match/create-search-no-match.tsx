import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

interface Props {
    readonly query: string;
}

export const CreateSearchNoMatch = ({ query }: Props) => {
    const { t } = useLingui();

    return <Text className="px-3xl text-primary text-[15px] leading-[20px] font-medium">{t`No matches for “${query}”`}</Text>;
};
