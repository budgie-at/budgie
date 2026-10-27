import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { WalletCaptureReviewCard } from '../wallet-capture-review-card/wallet-capture-review-card';

import type { WalletCaptureReviewItemInterface } from '../../interface/wallet-capture-review-item.interface';

interface Props {
    readonly reviewItems: WalletCaptureReviewItemInterface[];
    readonly mutatingCaptureIds: Record<string, boolean>;
    readonly getAccountTitle: (accountId: number | null, fallback: string) => string;
    readonly getAccountInstrumentSymbol: (accountId: number | null, fallback: string) => string;
    readonly importCapture: (captureId: string) => void;
    readonly dismissCapture: (captureId: string) => void;
}

export const WalletCaptureReviewList = ({
    reviewItems,
    mutatingCaptureIds,
    getAccountTitle,
    getAccountInstrumentSymbol,
    importCapture,
    dismissCapture
}: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    return (
        <View className="gap-y-lg">
            {reviewItems.map(item => {
                const { accountId, captureId } = item.capture;
                const fallbackTitle = isDefined(accountId) ? t`Account ${accountId}` : t`Account not found`;
                const accountTitle = getAccountTitle(accountId, fallbackTitle);
                const instrumentSymbol = getAccountInstrumentSymbol(accountId, defaultInstrument.symbol);
                const isMutating = mutatingCaptureIds[captureId];

                return (
                    <WalletCaptureReviewCard
                        key={captureId}
                        item={item}
                        accountTitle={accountTitle}
                        instrumentSymbol={instrumentSymbol}
                        isMutating={isMutating}
                        onImport={importCapture}
                        onDismiss={dismissCapture}
                    />
                );
            })}
        </View>
    );
};
