import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactElement } from 'react';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FileImportStepEnum } from '../../enum/file-import-step.enum';
import { CreateFileBankAccountSelector } from '../create-file-bank-account/create-file-bank-account.selector';

interface Props {
    readonly step: FileImportStepEnum;
    readonly isLoading: boolean;
    readonly hasSelectedAccounts: boolean;
    readonly importLabel: string;
    readonly onSelectFile: EmptyFn;
    readonly onReview: EmptyFn;
    readonly onImport: EmptyFn;
}

export const CreateFileBankAccountFooter = ({
    step,
    isLoading,
    hasSelectedAccounts,
    importLabel,
    onSelectFile,
    onReview,
    onImport
}: Props) => {
    const { t } = useLingui();

    const isReviewDisabled = isLoading || !hasSelectedAccounts;

    const footerButtons: Record<FileImportStepEnum, ReactElement> = {
        [FileImportStepEnum.FILE]: (
            <Button
                onPress={onSelectFile}
                disabled={isLoading}
                content={t`Select File`}
                leftIcon={UserIconNameEnum.Upload}
                testID={CreateFileBankAccountSelector.SelectFileButton}
            />
        ),
        [FileImportStepEnum.ACCOUNTS]: (
            <Button
                onPress={onReview}
                disabled={isReviewDisabled}
                isLoading={isLoading}
                content={t`Continue`}
                testID={CreateFileBankAccountSelector.StartSyncButton}
            />
        ),
        [FileImportStepEnum.REVIEW]: (
            <Button
                variant="cta"
                onPress={onImport}
                disabled={isLoading}
                isLoading={isLoading}
                content={importLabel}
                testID={CreateFileBankAccountSelector.ImportButton}
            />
        )
    };

    return <View className="gap-md pt-xl px-7xl">{footerButtons[step]}</View>;
};
