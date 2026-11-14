import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { CreateAccountTypeRow } from '../create-account-type-row/create-account-type-row';
import { CreateAccountTypeTile } from '../create-account-type-tile/create-account-type-tile';

import type { CreateAccountManualOptionInterface } from '../../interface/create-account-manual-option.interface';

interface Props {
    readonly options: readonly CreateAccountManualOptionInterface[];
    readonly footer: string | null;
}

export const CreateAccountManualSection = ({ options, footer }: Props) => {
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

    return (
        <GroupedListSection title={t`Add manually`} footer={footer}>
            {isAccessibilityTextSize ? (
                options.map(option => (
                    <CreateAccountTypeRow
                        key={option.type}
                        title={t(option.title)}
                        description={t(option.description)}
                        icon={option.icon}
                        type={option.type}
                    />
                ))
            ) : (
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
            )}
        </GroupedListSection>
    );
};
