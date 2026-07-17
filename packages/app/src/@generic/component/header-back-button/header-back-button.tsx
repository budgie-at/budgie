import { ReactNode } from 'react';

import { goBackOrReplace } from '../../utils/go-back-or-replace.util';
import { GoBackButton } from '../go-back-button/go-back-button';

export const HeaderBackButton = (): ReactNode => {
    const handlePress = () => void goBackOrReplace('/');

    return <GoBackButton onPress={handlePress} />;
};
