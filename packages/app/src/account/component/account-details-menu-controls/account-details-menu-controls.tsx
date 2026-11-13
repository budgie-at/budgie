import { router } from 'expo-router';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AnimatedBackdrop } from '../../../@generic/component/animated-backdrop/animated-backdrop';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { isInzhurFundAccount } from '../../../inzhur/utils/is-inzhur-fund-account.util';
import { CreateTransactionMenu } from '../../../transaction/components/create-transaction-menu/create-transaction-menu';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountFab } from '../account-fab/account-fab';

import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<
        AccountWithInstrumentEntityInterface,
        'id' | 'type' | 'externalSource' | 'externalId' | 'integrationId' | AccountAssociationEnum.INSTRUMENT
    >;
}

export const AccountDetailsMenuControls = ({ account }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);
    const handleBuy = () =>
        void router.push({
            pathname: '/securities/buy/[id]',
            params: {
                id: String(account.integrationId),
                symbol: account.instrument.providerInstrumentId ?? account.instrument.symbol,
                name: account.instrument.name,
                type: account.instrument.type
            }
        });

    if (isInzhurFundAccount(account) || isUntrackedOwnAccount(account)) {
        return null;
    }

    if (isDefined(account.integrationId) && isListedSecurityType(account.instrument.type)) {
        return <AccountFab isMenuOpen={false} onPress={handleBuy} />;
    }

    return (
        <>
            <AccountFab isMenuOpen={isMenuOpen} onPress={handleOpenMenu} />
            <AnimatedBackdrop isVisible={isMenuOpen} onClose={handleCloseMenu} />
            <CreateTransactionMenu isOpen={isMenuOpen} onClose={handleCloseMenu} accountId={account.id} accountType={account.type} />
        </>
    );
};
