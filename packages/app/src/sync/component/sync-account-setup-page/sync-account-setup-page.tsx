import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';

import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

const FORM_PAGE_SAFE_EDGES: Edge[] = ['bottom', 'top'];

interface Props {
    readonly onGoBack: () => void;
    readonly title: string;
    readonly description: string;
    readonly scrollViewTestID: string;
    readonly isInputStep: boolean;
    readonly isLoading: boolean;
    readonly isStartSyncDisabled: boolean;
    readonly onFetchAccounts: () => void;
    readonly onSetupSync: () => void;
    readonly inputStepContent: ReactNode;
    readonly accountsStepContent: ReactNode;
}

export const SyncAccountSetupPage = ({
    onGoBack,
    title,
    description,
    scrollViewTestID,
    isInputStep,
    isLoading,
    isStartSyncDisabled,
    onFetchAccounts,
    onSetupSync,
    inputStepContent,
    accountsStepContent
}: Props) => {
    const { t } = useLingui();

    const footer = isInputStep ? (
        <Button onPress={onFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />
    ) : (
        <Button onPress={onSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />
    );

    const stepContent = isInputStep ? inputStepContent : accountsStepContent;

    return (
        <FormPage
            header={<PageHeader onGoBack={onGoBack} title={title} description={description} />}
            footer={footer}
            safeEdges={FORM_PAGE_SAFE_EDGES}
            scrollViewTestID={scrollViewTestID}
        >
            <FormLayoutGroup>{stepContent}</FormLayoutGroup>
        </FormPage>
    );
};
