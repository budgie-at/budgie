import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CategorizeInboxGroupChoosePaymentsOption } from '../categorize-inbox-group-choose-payments-option/categorize-inbox-group-choose-payments-option';
import { CategorizeInboxGroupTagsOption } from '../categorize-inbox-group-tags-option/categorize-inbox-group-tags-option';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRefineOptions = ({ cluster }: Props) => (
    <View className="pt-3xl">
        <Text className="text-secondary-foreground pb-xs text-sm font-semibold">
            <Trans>Refine</Trans>
        </Text>
        <CategorizeInboxGroupTagsOption cluster={cluster} />
        <CategorizeInboxGroupChoosePaymentsOption cluster={cluster} />
    </View>
);
