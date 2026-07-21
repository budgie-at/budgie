import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CreateFileBankAccountSelector } from '../create-file-bank-account/create-file-bank-account.selector';

interface Props {
    readonly isFileStep: boolean;
    readonly isLoading: boolean;
    readonly hasSelectedAccounts: boolean;
    readonly onSelectFile: EmptyFn;
    readonly onSetupSync: EmptyFn;
}

export const CreateFileBankAccountFooter = ({ isFileStep, isLoading, hasSelectedAccounts, onSelectFile, onSetupSync }: Props) => {
    const { t } = useLingui();

    const footerProps = isFileStep
        ? {
              onPress: onSelectFile,
              disabled: isLoading,
              content: t`Select File`,
              leftIcon: UserIconNameEnum.Upload,
              testID: CreateFileBankAccountSelector.SelectFileButton
          }
        : {
              onPress: onSetupSync,
              disabled: isLoading || !hasSelectedAccounts,
              content: t`Start Sync`,
              testID: CreateFileBankAccountSelector.StartSyncButton
          };

    return (
        <View className="gap-md pt-xl px-7xl">
            <Button {...footerProps} />
        </View>
    );
};
