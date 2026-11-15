import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CreateAccountTypeTile } from '../create-account-type-tile/create-account-type-tile';

import type { CreateAccountManualOptionInterface } from '../../interface/create-account-manual-option.interface';

interface Props {
    readonly options: readonly CreateAccountManualOptionInterface[];
}

export const CreateAccountManualTiles = ({ options }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row flex-wrap px-md md:flex-nowrap">
            {options.map(option => (
                <CreateAccountTypeTile
                    key={option.type}
                    title={t(option.title)}
                    description={t(option.description)}
                    icon={option.icon}
                    type={option.type}
                />
            ))}
        </View>
    );
};
