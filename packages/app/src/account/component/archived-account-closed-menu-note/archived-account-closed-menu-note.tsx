import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'isExternal'>;
}

export const ArchivedAccountClosedMenuNote = ({ account }: Props) => {
    const { t } = useLingui();

    if (!account.isExternal) {
        return null;
    }

    return (
        <Text className="text-popover-secondary max-w-[260px] px-xl pt-sm pb-md text-[13px] leading-[18px]">
            {t`This account was closed at the provider, so it can’t come back to Home.`}
        </Text>
    );
};
