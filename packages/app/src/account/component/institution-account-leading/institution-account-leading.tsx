import { AccountTypeEnum, ExternalSourceEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { InstitutionMark } from '../institution-mark/institution-mark';

import type { AccountAssociationEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

interface Props {
    readonly account: Pick<AccountWithSyncEntityInterface, 'type' | 'title' | AccountAssociationEnum.INSTRUMENT>;
    readonly provider: ExternalSourceEnum;
}

export const InstitutionAccountLeading = ({ account, provider }: Props) => {
    if (account.type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoCurrencyIcon code={account.instrument.code} size={44} className="bg-surface-disc" />;
    }

    if (provider !== ExternalSourceEnum.INZHUR) {
        return <InstitutionMark provider={provider} title={account.title} />;
    }

    if (account.instrument.type === InstrumentTypeEnum.FUND) {
        return (
            <View className="size-[40px] items-center justify-center rounded-[10px] bg-surface-disc" style={CONTINUOUS_CORNERS}>
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-[17px] font-semibold text-primary">
                    {account.instrument.symbol.charAt(0)}
                </Text>
            </View>
        );
    }

    return (
        <CircleIcon
            icon={UserIconNameEnum.Banknote}
            size={40}
            iconSize={20}
            radius={10}
            variant="ghost"
            border={false}
            className="bg-surface-disc"
            iconClassName="text-primary"
        />
    );
};
