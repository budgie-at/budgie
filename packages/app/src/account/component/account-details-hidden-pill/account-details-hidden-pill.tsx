import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { useUnhideAccount } from '../../hooks/use-unhide-account.hook';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title'>;
}

export const AccountDetailsHiddenPill = ({ account }: Props) => {
    const { t } = useLingui();
    const { isLoading, unhide } = useUnhideAccount(account);
    const accountTitle = account.title;

    return (
        <View className="flex-row items-center gap-x-md">
            <MetaPill icon={UserIconNameEnum.EyeOff} label={t`Hidden from Home`} />
            <SettingsPillButton
                label={t`Unhide`}
                accessibilityLabel={t`Unhide ${accountTitle}`}
                variant="secondary"
                size="sm"
                isLoading={isLoading}
                onPress={unhide}
            />
        </View>
    );
};
