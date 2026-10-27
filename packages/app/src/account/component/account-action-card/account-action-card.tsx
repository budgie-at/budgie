import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'icon' | 'title' | 'type'>;
    readonly balance: number;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly children: ReactNode;
}

export const AccountActionCard = ({ account, balance, currencySymbol, testID, children }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();

    return (
        <SimpleHorizontalCell
            testID={testID}
            right={
                <View className="flex-row items-center gap-x-xl">
                    <ProtectedText className="text-destructive-foreground text-sm font-semibold">
                        {formatDigits(balance, currencySymbol)}
                    </ProtectedText>

                    {children}
                </View>
            }
            left={<CircleIcon icon={account.icon} variant="dark-warning" size={46} iconSize={20} />}
            title={account.title}
            description={t(ACCOUNT_TYPE[account.type])}
        />
    );
};
