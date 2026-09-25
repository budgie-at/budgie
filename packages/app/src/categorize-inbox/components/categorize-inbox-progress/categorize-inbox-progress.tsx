import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxEnrichmentStatusEnum } from '../../enum/categorize-inbox-enrichment-status.enum';

import { CategorizeInboxProgressSelector } from './categorize-inbox-progress.selector';

interface Props {
    readonly confidentRowCount: number;
    readonly enrichmentStatus: CategorizeInboxEnrichmentStatusEnum;
    readonly onAcceptConfident: () => void;
}

export const CategorizeInboxProgress = ({ confidentRowCount, enrichmentStatus, onAcceptConfident }: Props) => {
    const { t } = useLingui();
    const { isBusy } = useCategorizeInboxContext();

    const acceptLabel = t({
        message: plural(confidentRowCount, { one: 'Accept # confident suggestion', other: 'Accept # confident suggestions' })
    });
    const isRunning = enrichmentStatus === CategorizeInboxEnrichmentStatusEnum.RUNNING;
    const isAcceptDisabled = isBusy || !isPositiveNumber(confidentRowCount);

    return (
        <View className="gap-y-md py-md">
            <Button
                content={acceptLabel}
                onPress={onAcceptConfident}
                disabled={isAcceptDisabled}
                testID={CategorizeInboxProgressSelector.AcceptConfidentButton}
            />

            {isRunning ? (
                <Text className="text-secondary-foreground text-xs">
                    <Trans>Finding similar merchants…</Trans>
                </Text>
            ) : null}
        </View>
    );
};
