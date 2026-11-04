import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { FileUploadStep } from '../../../sync/component/file-upload-step/file-upload-step';
import { useInzhurStatementImport } from '../../hook/use-inzhur-statement-import.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummary } from '../inzhur-import-summary/inzhur-import-summary';

export const ImportInzhurStatement = () => {
    const { t } = useLingui();
    const { isLoading, summary, handleSelectFile } = useInzhurStatementImport();

    const exportSteps = [t`Open the Inzhur app`, t`Request the statement of your securities account`, t`Save the statement as a PDF`];

    const handleDone = () => void router.dismissTo('/');

    const footer = isDefined(summary) ? (
        <PillButtonFooter label={t`Done`} testID={InzhurSelector.DoneButton} onPress={handleDone} />
    ) : (
        <PillButtonFooter
            label={t`Select File`}
            isLoading={isLoading}
            testID={InzhurSelector.SelectFileButton}
            onPress={handleSelectFile}
        />
    );
    const content = isDefined(summary) ? (
        <InzhurImportSummary summary={summary} />
    ) : (
        <FileUploadStep
            steps={exportSteps}
            fileIcon={UserIconNameEnum.FileText}
            fileTypeLabel={t`PDF statement`}
            selectFileText={t`Select the downloaded PDF file`}
            onSelectFile={handleSelectFile}
            isLoading={isLoading}
        />
    );

    return (
        <CollapsibleChromePage
            title={t`Import Inzhur statement`}
            subtitle={t`Update your fund certificates from the depository statement`}
            leading={<HeaderBackButton />}
            testID={InzhurSelector.ImportPage}
            footer={footer}
        >
            <FormLayoutGroup>{content}</FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
