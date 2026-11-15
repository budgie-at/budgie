import { InstitutionRowCash } from '../institution-row-cash/institution-row-cash';
import { InstitutionRowTotal } from '../institution-row-total/institution-row-total';

import type { InstitutionGroupInterface } from '../../interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'integrationId' | 'cash' | 'total' | 'isHoldingProvider'>;
}

export const InstitutionRowTrailing = ({ institution }: Props) =>
    institution.isHoldingProvider ? (
        <InstitutionRowCash integrationId={institution.integrationId} cash={institution.cash} />
    ) : (
        <InstitutionRowTotal integrationId={institution.integrationId} total={institution.total} />
    );
