import { UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { WalletCaptureReviewReasonEnum } from '../../enum/wallet-capture-review-reason.enum';

interface Props {
    readonly reason: WalletCaptureReviewReasonEnum;
}

export const WalletCaptureReviewReasonIcon = ({ reason }: Props) => {
    if (reason === WalletCaptureReviewReasonEnum.DUPLICATE) {
        return <CircleIcon icon={UserIconNameEnum.CircleAlert} variant="warning" size={40} iconSize={20} radius={20} />;
    }

    return <CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="dark-warning" size={40} iconSize={20} radius={20} />;
};
