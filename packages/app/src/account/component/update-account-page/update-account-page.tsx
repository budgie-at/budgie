import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountActiveToggleField } from '../account-active-toggle-field/account-active-toggle-field';
import { ArchiveAccount } from '../archive-account/archive-account';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly account: AccountEntityInterface;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'isActive'>;
    readonly hero: ReactNode;
    readonly children?: ReactNode;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountPage = ({ account, fields, hero, children, onSubmit, isSubmitting }: Props) => {
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
                    titleBinding={fields.title}
                    iconBinding={fields.icon}
                    variant={variant}
                    nameInputTestID={CreateAccountScreenSelector.NameInput}
                    selectNameOnFocus
                />

                {children}

                <AccountActiveToggleField value={fields.isActive.field.value} onChange={fields.isActive.field.onChange} />
            </FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
