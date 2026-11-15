import { InstitutionRowHoldingTotal } from '../institution-row-holding-total/institution-row-holding-total';
import { InstitutionRowTotal } from '../institution-row-total/institution-row-total';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'integrationId' | 'total' | 'isHoldingProvider'>;
    readonly returnPercent: number | undefined;
    readonly isReturnLoading: boolean;
}

export const InstitutionRowTrailing = ({ institution, returnPercent, isReturnLoading }: Props) =>
    institution.isHoldingProvider ? (
        <InstitutionRowHoldingTotal
            integrationId={institution.integrationId}
            total={institution.total}
            returnPercent={returnPercent}
            isReturnLoading={isReturnLoading}
        />
    ) : (
        <InstitutionRowTotal integrationId={institution.integrationId} total={institution.total} />
    );
