import { AccountEntityInterface, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Control } from 'react-hook-form';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { AccountActiveToggleField } from '../account-active-toggle-field/account-active-toggle-field';
import { ArchiveAccount } from '../archive-account/archive-account';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props<T extends { title: string; icon: UserIconType; isActive?: boolean }> {
    readonly account: AccountEntityInterface;
    readonly control: Control<T>;
    readonly hero: ReactNode;
    readonly children?: ReactNode;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountPage = <T extends { title: string; icon: UserIconType; isActive?: boolean }>({
    account,
    control,
    hero,
    children,
    onSubmit,
    isSubmitting
}: Props<T>) => {
    const { t } = useLingui();
    const variant = ACCOUNT_COLOR[account.type];

    return (
        <CollapsibleChromePage
            title={t`Account Settings`}
            leading={<HeaderBackButton />}
            testID={CreateAccountScreenSelector.ScrollView}
            footer={
                <View className="gap-md pt-xl px-7xl">
                    <View className="flex-row gap-2">
                        <ArchiveAccount accountId={account.id} />
                        <Button
                            onPress={onSubmit}
                            size="sm"
                            variant={variant}
                            isLoading={isSubmitting}
                            content={t`Update Account`}
                            className="flex-1"
                            testID={CreateAccountScreenSelector.SubmitButton}
                        />
                    </View>
                </View>
            }
        >
            {hero}

            <FormLayoutGroup>
                <AccountDetailsField
                    control={control}
                    variant={variant}
                    nameInputTestID={CreateAccountScreenSelector.NameInput}
                    selectNameOnFocus
                />

                {children}

                <AccountActiveToggleField control={control} />
            </FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
