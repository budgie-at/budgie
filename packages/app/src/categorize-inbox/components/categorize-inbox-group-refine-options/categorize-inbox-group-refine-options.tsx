import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { CategorizeInboxGroupChoosePaymentsOption } from '../categorize-inbox-group-choose-payments-option/categorize-inbox-group-choose-payments-option';
import { CategorizeInboxGroupTagsOption } from '../categorize-inbox-group-tags-option/categorize-inbox-group-tags-option';
import { CategorizeInboxOptionCard } from '../categorize-inbox-option-card/categorize-inbox-option-card';
import { CategorizeInboxOptionSectionTitle } from '../categorize-inbox-option-section-title/categorize-inbox-option-section-title';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRefineOptions = ({ cluster }: Props) => (
    <View>
        <CategorizeInboxOptionSectionTitle>
            <Trans>Refine</Trans>
        </CategorizeInboxOptionSectionTitle>
        <CategorizeInboxOptionCard>
            <CategorizeInboxGroupTagsOption cluster={cluster} />
            <CategorizeInboxGroupChoosePaymentsOption cluster={cluster} />
        </CategorizeInboxOptionCard>
    </View>
);
