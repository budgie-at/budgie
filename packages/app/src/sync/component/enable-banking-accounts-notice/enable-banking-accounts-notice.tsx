import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly parkedPreviews: readonly SyncAccountPreviewInterface[];
}

export const EnableBankingAccountsNotice = ({ parkedPreviews }: Props) => {
    const parkedTitles = parkedPreviews.map(preview => preview.title).join(', ');

    return (
        <View className="gap-y-md pt-md">
            {isNotEmptyArray(parkedPreviews) ? (
                <>
                    <Text className="text-secondary-foreground text-xs px-md">
                        <Trans>
                            These accounts cannot be connected: they already sync through another connection or use a currency Budgie does
                            not support.
                        </Trans>
                    </Text>
                    <SimpleHorizontalCell
                        left={<CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="warning" size={15} iconSize={15} />}
                        size="lg"
                        variant="warning"
                        title={parkedTitles}
                    />
                </>
            ) : null}

            <Text className="text-secondary-foreground text-xs px-md">
                <Trans>Missing an account? Link it to your application in Enable Banking, then connect this bank again.</Trans>
            </Text>
        </View>
    );
};
