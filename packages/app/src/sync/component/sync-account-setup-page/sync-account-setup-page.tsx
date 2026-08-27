import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly onGoBack: () => void;
    readonly footer: ReactNode;
    readonly scrollViewTestID: string;
    readonly children: ReactNode;
}

export const SyncAccountSetupPage = ({ title, description, onGoBack, footer, scrollViewTestID, children }: Props) => (
    <CollapsibleChromePage
        title={title}
        subtitle={description}
        leading={<GoBackButton onPress={onGoBack} />}
        footer={footer}
        testID={scrollViewTestID}
    >
        <FormLayoutGroup>{children}</FormLayoutGroup>
    </CollapsibleChromePage>
);
