import { useEffect } from 'react';
import { isDefined } from '@rnw-community/shared';
import { __REMOVE_ME_RESET_DB } from '../db/db';

/** @deprecated TODO: REMOVE ME WHEN DB IS STABLE! */
export const useResetDb = (error: unknown) => {
    useEffect(() => {
        if (isDefined(error)) {
            void __REMOVE_ME_RESET_DB();
        }
    }, [error]);
};
