import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AnimatedBackdrop } from '../../../@generic/component/animated-backdrop/animated-backdrop';
import { CreateTransactionMenu } from '../../../transaction/components/create-transaction-menu/create-transaction-menu';
import { useGetAccountByIdQuery } from '../../query/use-get-account-by-id.query';
import { AccountFab } from '../account-fab/account-fab';

interface Props {
    readonly accountId: number;
    readonly accountType?: AccountTypeEnum;
}

export const AccountDetailsMenuControls = ({ accountId, accountType }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { account } = useGetAccountByIdQuery(accountId);

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);

    if (account?.instrument.type === InstrumentTypeEnum.FUND && isDefined(account.integrationId)) {
        return null;
    }

    return (
        <>
            <AccountFab isMenuOpen={isMenuOpen} onPress={handleOpenMenu} />
            <AnimatedBackdrop isVisible={isMenuOpen} onClose={handleCloseMenu} />
            <CreateTransactionMenu isOpen={isMenuOpen} onClose={handleCloseMenu} accountId={accountId} accountType={accountType} />
        </>
    );
};
