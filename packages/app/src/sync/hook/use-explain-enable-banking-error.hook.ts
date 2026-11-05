import {
    EnableBankingCallbackError,
    EnableBankingCallbackFailureEnum,
    EnableBankingErrorCodeEnum,
    SyncInvalidResponseError,
    resolveSyncErrorCode
} from '@budgie/sync';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { SYNC_ERROR_LABEL } from '../constant/sync-error-label.constant';
import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';

import type { MessageDescriptor } from '@lingui/core';

const CALLBACK_FAILURE_LABEL: Record<EnableBankingCallbackFailureEnum, MessageDescriptor> = {
    [EnableBankingCallbackFailureEnum.CANCELLED]: msg`Authorization was cancelled at your bank.`,
    [EnableBankingCallbackFailureEnum.EXPIRED]: msg`The authorization took too long. Start again.`,
    [EnableBankingCallbackFailureEnum.MALFORMED]: msg`Budgie could not read the response from your bank. Start again.`,
    [EnableBankingCallbackFailureEnum.STATE_MISMATCH]: msg`This response does not match an authorization started in Budgie. Start again.`
};

const SETUP_ERROR_LABEL: Record<EnableBankingSetupErrorReasonEnum, MessageDescriptor> = {
    [EnableBankingSetupErrorReasonEnum.INVALID_FORMAT]: msg`This file is not an unencrypted RSA private key in PEM format.`,
    [EnableBankingSetupErrorReasonEnum.ENCRYPTED]: msg`This key is password protected. Use the .pem file as downloaded from Enable Banking.`,
    [EnableBankingSetupErrorReasonEnum.UNREADABLE_FILE]: msg`Could not read the selected file.`,
    [EnableBankingSetupErrorReasonEnum.BROWSER_UNAVAILABLE]: msg`Could not open your browser. Try again.`,
    [EnableBankingSetupErrorReasonEnum.STORAGE_FAILED]: msg`Could not save the key in this phone's secure storage. Nothing was connected.`,
    [EnableBankingSetupErrorReasonEnum.INACTIVE_APPLICATION]: msg`This application is not active yet. Open it in Enable Banking, tap Activate by linking accounts and log in to your bank, then choose the key again.`,
    [EnableBankingSetupErrorReasonEnum.REDIRECT_URL_MISSING]: msg`The application does not list the redirect URL shown in the setup steps. Add it exactly as shown.`
};

const REDIRECT_URL_LABEL = msg`Enable Banking rejected the redirect URL. Correct the redirect URL registered in your application so it matches the setup steps exactly.`;

const resolveLabel = (error: unknown): MessageDescriptor | null => {
    if (error instanceof EnableBankingCallbackError) {
        return CALLBACK_FAILURE_LABEL[error.failure];
    }
    if (error instanceof EnableBankingSetupError) {
        return SETUP_ERROR_LABEL[error.reason];
    }
    if (error instanceof SyncInvalidResponseError && error.apiCode === EnableBankingErrorCodeEnum.REDIRECT_URI_NOT_ALLOWED) {
        return REDIRECT_URL_LABEL;
    }

    const errorCode = resolveSyncErrorCode(error);

    return isDefined(errorCode) ? SYNC_ERROR_LABEL[errorCode] : null;
};

export const useExplainEnableBankingError = () => {
    const { t } = useLingui();

    return (error: unknown) => {
        const label = resolveLabel(error);

        return isDefined(label) ? new Error(t(label)) : error;
    };
};
