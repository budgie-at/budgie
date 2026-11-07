import { CloudSyncHost } from '@budgie/cloud-sync';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { appStateChanges } from '../../@generic/constant/app-state-changes.constant';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { iCloudAccountRefreshAtom } from '../../cloud-backup/constant/icloud-account-refresh-atom.constant';
import { householdJoinAtom } from '../../household/constant/household-join-atom.constant';
import { householdOwnerNameAtom } from '../../household/constant/household-owner-name-atom.constant';
import { householdReadyAtom } from '../../household/constant/household-ready-atom.constant';
import { householdRefreshAtom } from '../../household/constant/household-refresh-atom.constant';
import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';

export const cloudSyncHostLayer = Layer.succeed(CloudSyncHost, {
    deviceName: Constants.deviceName ?? '',
    isForeground: Effect.sync(() => AppState.currentState === 'active'),
    foregroundChanges: Stream.map(appStateChanges, state => state === 'active'),
    publishStatus: status =>
        Effect.sync(() => {
            appAtomRegistry.set(cloudSyncStatusAtom, status);
        }),
    publishHousehold: isReady =>
        Effect.sync(() => {
            appAtomRegistry.set(householdReadyAtom, isReady);
        }),
    publishHouseholdOwnerName: ownerDisplayName =>
        Effect.sync(() => {
            appAtomRegistry.set(householdOwnerNameAtom, ownerDisplayName);
        }),
    publishJoin: (status, ownerDisplayName) =>
        Effect.sync(() => {
            appAtomRegistry.set(householdJoinAtom, { status, ownerDisplayName });
        }),
    bumpHouseholdRefresh: Effect.sync(() => {
        appAtomRegistry.update(householdRefreshAtom, count => count + 1);
    }),
    bumpAccountRefresh: Effect.sync(() => {
        appAtomRegistry.update(iCloudAccountRefreshAtom, count => count + 1);
    }),
    notifyJoinFailed: Effect.sync(() => {
        showErrorToast(t`Could not join the family`, t`The invitation could not be accepted. Open the invitation link again to retry.`);
    })
});
