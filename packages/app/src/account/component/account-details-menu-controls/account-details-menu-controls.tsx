import { AccountTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { AnimatedBackdrop } from '../../../@generic/component/animated-backdrop/animated-backdrop';
import { CreateTransactionMenu } from '../../../transaction/components/create-transaction-menu/create-transaction-menu';
import { AccountFab } from '../account-fab/account-fab';

interface Props {
    readonly accountId: number;
    readonly accountType?: AccountTypeEnum;
}

export const AccountDetailsMenuControls = ({ accountId, accountType }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleOpenMenu = () => void setIsMenuOpen(true);
    const handleCloseMenu = () => void setIsMenuOpen(false);

    return (
        <>
            <AccountFab isMenuOpen={isMenuOpen} onPress={handleOpenMenu} />
            <AnimatedBackdrop isVisible={isMenuOpen} onClose={handleCloseMenu} />
            <CreateTransactionMenu isOpen={isMenuOpen} onClose={handleCloseMenu} accountId={accountId} accountType={accountType} />
        </>
    );
};
