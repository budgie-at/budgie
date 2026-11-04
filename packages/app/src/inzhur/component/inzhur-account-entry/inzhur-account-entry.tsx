import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useInzhurSetupQuery } from '../../query/use-inzhur-setup.query';
import { CreateInzhurAccount } from '../create-inzhur-account/create-inzhur-account';
import { ImportInzhurStatement } from '../import-inzhur-statement/import-inzhur-statement';

export const InzhurAccountEntry = () => {
    const { setup, isLoading } = useInzhurSetupQuery();

    if (isLoading) {
        return <EmptyScreen />;
    }

    return isDefined(setup) ? <ImportInzhurStatement /> : <CreateInzhurAccount />;
};
