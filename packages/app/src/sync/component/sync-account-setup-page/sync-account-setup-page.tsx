import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';

import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

const FORM_PAGE_SAFE_EDGES: Edge[] = ['bottom', 'top'];

interface Props {
    readonly title: string;
    readonly description: string;
    readonly onGoBack: () => void;
    readonly footer: ReactNode;
    readonly scrollViewTestID: string;
    readonly children: ReactNode;
}

export const SyncAccountSetupPage = ({ title, description, onGoBack, footer, scrollViewTestID, children }: Props) => (
    <FormPage
        header={<PageHeader onGoBack={onGoBack} title={title} description={description} />}
        footer={footer}
        safeEdges={FORM_PAGE_SAFE_EDGES}
        scrollViewTestID={scrollViewTestID}
    >
        <FormLayoutGroup>{children}</FormLayoutGroup>
    </FormPage>
);
