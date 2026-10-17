import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as FiberHandle from 'effect/FiberHandle';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as PubSub from 'effect/PubSub';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { NetworkTypeEnum } from '../../@generic/enum/network-type.enum';
import { NetworkService } from '../../@generic/service/network.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { AI_MODEL_DOWNLOAD_ORDER, AI_MODEL_FILES, AI_MODEL_FREE_SPACE_RESERVE_BYTES } from '../constant/ai-model-files.constant';
import { aiModelDownloadSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { WHISPER_MODEL_FILENAME } from '../constant/whisper-model.constant';
import { AiModelDownloadHoldEnum } from '../enum/ai-model-download-hold.enum';
import { AiModelDownloadOutcomeEnum } from '../enum/ai-model-download-outcome.enum';
import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiModelDownloadError } from '../error/ai-model-download.error';
import { patchAtom } from '../utils/patch-atom.util';
import { sumAiModelDownloadBytes } from '../utils/sum-ai-model-download-bytes.util';

import type { AiModelActiveDownloadInterface } from '../interface/ai-model-active-download.interface';
import type { AiModelDownloadProgressInterface } from '../interface/ai-model-download-progress.interface';
import type { AiModelDownloadSnapshotInterface } from '../interface/ai-model-download-snapshot.interface';
import type { AiModelFilesLocationInterface } from '../interface/ai-model-files-location.interface';
import type { AiModelThroughputSampleInterface } from '../interface/ai-model-throughput-sample.interface';
import type { DownloadProgress } from 'expo-file-system';

export class AiModelDownloadService extends Context.Service<AiModelDownloadService>()('@budgie/app/AiModelDownloadService', {
    make: Effect.gen(function* () {
        const networkService = yield* NetworkService;
        const job = yield* FiberHandle.make();
        const control = yield* Semaphore.make(1);
        const completions = yield* PubSub.unbounded<AiSubsystemNameEnum>();
        const progressPatchStepBytes = 1_000_000;
        const throughputSampleCount = 10;
        const millisecondsPerSecond = 1000;
        const sampleInterval = Duration.seconds(2);
        const retrySchedule = Schedule.exponential(Duration.seconds(2));
        const retryTimes = 3;
        const StateSchema = Schema.fromJsonString(
            Schema.Struct({
                hold: Schema.NullOr(Schema.Enum(AiModelDownloadHoldEnum)),
                resumes: Schema.Record(
                    Schema.String,
                    Schema.Struct({
                        resumeData: Schema.String,
                        bytesWritten: Schema.Number,
                        totalBytes: Schema.Number,
                        reportedTotalBytes: Schema.Number
                    })
                )
            })
        );
        const emptyState: typeof StateSchema.Type = { hold: null, resumes: {} };
        const stateFile = new File(Paths.document, 'ai-model-download.json');
        const reportedTotals = new Map<AiSubsystemNameEnum, number>();
        let state = emptyState;
        let isWifiOnly = true;
        let enabledSubsystems: ReadonlySet<AiSubsystemNameEnum> = new Set();
        let networkType = yield* networkService.current;
        let activeDownload: AiModelActiveDownloadInterface | null = null;
        let throughputSamples: readonly AiModelThroughputSampleInterface[] = [];

        const getSnapshot = (): AiModelDownloadSnapshotInterface => appAtomRegistry.get(aiModelDownloadSnapshotAtom);

        const patchSnapshot = (patch: Partial<AiModelDownloadSnapshotInterface>): void => {
            patchAtom(aiModelDownloadSnapshotAtom, patch);
        };

        const patchModel = (name: AiSubsystemNameEnum, patch: Partial<AiModelDownloadProgressInterface>): void => {
            const { models } = getSnapshot();
            patchSnapshot({ models: { ...models, [name]: { ...models[name], ...patch } } });
        };

        const resolveFiles = (name: AiSubsystemNameEnum): AiModelFilesLocationInterface => {
            const { directory: directoryName, filename } = AI_MODEL_FILES[name];
            const directory = isDefined(directoryName) ? new Directory(Paths.document, directoryName) : Paths.document;

            return {
                directory,
                modelFile: new File(directory, filename),
                tempFile: new File(directory, `${filename}.download`)
            };
        };

        const deleteIfExists = (...files: File[]): void => {
            for (const file of files) {
                if (file.exists) {
                    file.delete();
                }
            }
        };

        const isModelComplete = (name: AiSubsystemNameEnum): boolean => {
            const { modelFile } = resolveFiles(name);

            return modelFile.exists && isPositiveNumber(modelFile.size);
        };

        const isTaskInState = (task: DownloadTask, taskState: DownloadTask['state']): boolean => task.state === taskState;

        const enabledModels = (): AiSubsystemNameEnum[] => AI_MODEL_DOWNLOAD_ORDER.filter(name => enabledSubsystems.has(name));

        const isNetworkAllowed = (): boolean =>
            networkType === NetworkTypeEnum.WIFI ||
            (networkType !== NetworkTypeEnum.OFFLINE && (!isWifiOnly || getSnapshot().isMobileDataAllowed));

        const isWaiting = (status: AiModelDownloadStatusEnum): boolean =>
            status === AiModelDownloadStatusEnum.WAITING_FOR_WIFI || status === AiModelDownloadStatusEnum.WAITING_FOR_NETWORK;

        const enterWaiting = (): void => {
            const { status, isNoticeDismissed } = getSnapshot();
            patchSnapshot({
                status:
                    networkType === NetworkTypeEnum.OFFLINE
                        ? AiModelDownloadStatusEnum.WAITING_FOR_NETWORK
                        : AiModelDownloadStatusEnum.WAITING_FOR_WIFI,
                isNoticeDismissed: isWaiting(status) && isNoticeDismissed,
                bytesPerSecond: 0
            });
        };

        const getRemainingBytes = (): number => {
            const { downloadedBytes, totalBytes } = sumAiModelDownloadBytes(Object.values(getSnapshot().models));

            return Math.max(0, totalBytes - downloadedBytes);
        };

        const writeState = Effect.fnUntraced(function* (next: typeof StateSchema.Type) {
            state = next;
            if (!isDefined(next.hold) && isEmptyArray(Object.keys(next.resumes))) {
                yield* Effect.sync(() => {
                    deleteIfExists(stateFile);
                });

                return;
            }
            const encoded = yield* Schema.encodeEffect(StateSchema)(next).pipe(Effect.orDie);
            yield* Effect.sync(() => {
                stateFile.writeSync(encoded);
            });
        });

        const forgetResume = (name: AiSubsystemNameEnum) => {
            const resumes = new Map(Object.entries(state.resumes));
            resumes.delete(name);

            return writeState({ ...state, resumes: Object.fromEntries(resumes) });
        };

        const rememberResume = Effect.fnUntraced(function* (name: AiSubsystemNameEnum, resumeData: string | undefined) {
            if (!isNotEmptyString(resumeData)) {
                patchModel(name, { bytesWritten: 0 });

                return yield* forgetResume(name);
            }
            const { bytesWritten, totalBytes } = getSnapshot().models[name];
            const reportedTotalBytes = reportedTotals.get(name) ?? 0;

            return yield* writeState({
                ...state,
                resumes: { ...state.resumes, [name]: { resumeData, bytesWritten, totalBytes, reportedTotalBytes } }
            });
        });

        const findResumeData = (name: AiSubsystemNameEnum): string | null => {
            const saved = state.resumes[name];
            if (isDefined(saved)) {
                return saved.resumeData;
            }
            const { tempFile } = resolveFiles(name);

            return Platform.OS === 'android' && tempFile.exists && isPositiveNumber(tempFile.size) ? String(tempFile.size) : null;
        };

        const makeProgressHandler =
            (name: AiSubsystemNameEnum) =>
            (progress: DownloadProgress): void => {
                if (isPositiveNumber(progress.totalBytes) && !reportedTotals.has(name)) {
                    reportedTotals.set(name, progress.totalBytes);
                }
                const current = getSnapshot().models[name];
                const totalBytes = reportedTotals.get(name) ?? current.totalBytes;
                const isStepReached = Math.abs(progress.bytesWritten - current.bytesWritten) >= progressPatchStepBytes;
                if (isStepReached || progress.bytesWritten >= totalBytes || totalBytes !== current.totalBytes) {
                    patchModel(name, { bytesWritten: progress.bytesWritten, totalBytes });
                }
            };

        const runTask = Effect.fnUntraced(function* (name: AiSubsystemNameEnum, resumeData: string | null) {
            const { url } = AI_MODEL_FILES[name];
            const { directory, tempFile } = resolveFiles(name);
            yield* Effect.sync(() => {
                if (!directory.exists) {
                    directory.create({ idempotent: true, intermediates: true });
                }
                if (!isDefined(resumeData)) {
                    deleteIfExists(tempFile);
                    reportedTotals.delete(name);
                    patchModel(name, { bytesWritten: 0, isComplete: false });
                }
            });
            const onProgress = makeProgressHandler(name);
            const task = isDefined(resumeData)
                ? DownloadTask.fromSavable({ url, fileUri: tempFile.uri, isDirectory: false, resumeData }, { onProgress })
                : File.createDownloadTask(url, tempFile, { onProgress });
            activeDownload = { name, task };

            return yield* Effect.tryPromise({
                try: () => (isDefined(resumeData) ? task.resumeAsync() : task.downloadAsync()),
                catch: cause => new AiModelDownloadError({ cause })
            }).pipe(
                Effect.ensuring(
                    Effect.sync(() => {
                        activeDownload = null;
                    })
                )
            );
        });

        const withRetries = <A>(effect: Effect.Effect<A, AiModelDownloadError>) =>
            Effect.retry(effect, { schedule: retrySchedule, times: retryTimes, while: isNetworkAllowed });

        const finalizeModel = Effect.fnUntraced(function* (name: AiSubsystemNameEnum) {
            const { modelFile, tempFile } = resolveFiles(name);
            const expectedBytes = reportedTotals.get(name) ?? 0;
            const downloadedBytes = tempFile.exists ? tempFile.size : 0;
            yield* forgetResume(name);
            if (!isPositiveNumber(expectedBytes) || downloadedBytes !== expectedBytes) {
                yield* Effect.sync(() => {
                    deleteIfExists(tempFile);
                });

                return AiModelDownloadOutcomeEnum.DAMAGED;
            }
            yield* Effect.sync(() => {
                deleteIfExists(modelFile);
            });
            yield* Effect.promise(() => tempFile.move(modelFile));
            patchModel(name, { bytesWritten: downloadedBytes, totalBytes: downloadedBytes, isComplete: true });

            return AiModelDownloadOutcomeEnum.COMPLETED;
        });

        const downloadModel = Effect.fnUntraced(function* (name: AiSubsystemNameEnum) {
            const resumeData = findResumeData(name);
            const file = yield* withRetries(runTask(name, resumeData)).pipe(
                Effect.catch(error =>
                    isDefined(resumeData) ? Effect.andThen(forgetResume(name), withRetries(runTask(name, null))) : Effect.fail(error)
                )
            );

            return isDefined(file) ? yield* Effect.uninterruptible(finalizeModel(name)) : AiModelDownloadOutcomeEnum.PAUSED;
        });

        const pauseTask = Effect.fnUntraced(function* () {
            const download = activeDownload;
            if (!isDefined(download) || !isTaskInState(download.task, 'active')) {
                return;
            }
            yield* Effect.tryPromise({ try: () => download.task.pauseAsync(), catch: cause => new AiModelDownloadError({ cause }) }).pipe(
                Effect.ignore
            );
            if (isTaskInState(download.task, 'paused')) {
                yield* rememberResume(download.name, download.task.savable().resumeData);
            }
        });

        const checkSpace = Effect.fnUntraced(function* () {
            const freeBytes = yield* Effect.sync(() => Paths.availableDiskSpace);
            const missingBytes = getRemainingBytes() + AI_MODEL_FREE_SPACE_RESERVE_BYTES - freeBytes;
            if (!isPositiveNumber(freeBytes) || !isPositiveNumber(missingBytes)) {
                return true;
            }
            patchSnapshot({ status: AiModelDownloadStatusEnum.NEEDS_SPACE, missingBytes, freeBytes, bytesPerSecond: 0 });

            return false;
        });

        const sampleProgress = Effect.gen(function* () {
            const at = yield* Clock.currentTimeMillis;
            const { downloadedBytes } = sumAiModelDownloadBytes(Object.values(getSnapshot().models));
            throughputSamples = [...throughputSamples, { at, bytes: downloadedBytes }].slice(-throughputSampleCount);
            const [first] = throughputSamples;
            const seconds = (at - first.at) / millisecondsPerSecond;
            patchSnapshot({ bytesPerSecond: isPositiveNumber(seconds) ? Math.max(0, (downloadedBytes - first.bytes) / seconds) : 0 });
            if (!(yield* checkSpace())) {
                yield* pauseTask();
            }
        });

        const holdAsDamaged = Effect.fnUntraced(function* (name: AiSubsystemNameEnum) {
            yield* writeState({ ...state, hold: AiModelDownloadHoldEnum.DAMAGED });
            patchModel(name, { bytesWritten: 0, isComplete: false });
            patchSnapshot({ status: AiModelDownloadStatusEnum.DAMAGED, bytesPerSecond: 0 });
        });

        const runJob = Effect.fn('AiModelDownloadService.runJob')(
            function* () {
                throughputSamples = [];
                yield* Effect.forkChild(Effect.repeat(sampleProgress, Schedule.spaced(sampleInterval)));
                for (const name of enabledModels().filter(modelName => !isModelComplete(modelName))) {
                    if (!(yield* checkSpace())) {
                        return;
                    }
                    if (!isNetworkAllowed()) {
                        enterWaiting();

                        return;
                    }
                    patchSnapshot({ status: AiModelDownloadStatusEnum.DOWNLOADING });
                    const outcome = yield* downloadModel(name);
                    if (outcome === AiModelDownloadOutcomeEnum.DAMAGED) {
                        yield* holdAsDamaged(name);
                    }
                    if (outcome !== AiModelDownloadOutcomeEnum.COMPLETED) {
                        return;
                    }
                    yield* PubSub.publish(completions, name);
                }
                patchSnapshot({ status: AiModelDownloadStatusEnum.READY, isMobileDataAllowed: false, bytesPerSecond: 0 });
            },
            effect =>
                effect.pipe(
                    Effect.catch(() =>
                        Effect.sync(() => {
                            if (isNetworkAllowed()) {
                                patchSnapshot({ status: AiModelDownloadStatusEnum.FAILED, bytesPerSecond: 0 });
                            } else {
                                enterWaiting();
                            }
                        })
                    )
                )
        );

        const startJob = () => Effect.asVoid(FiberHandle.run(job, runJob(), { onlyIfMissing: true }));

        const stopJob = Effect.fnUntraced(function* () {
            yield* pauseTask();
            yield* FiberHandle.clear(job);
        });

        const applyNetwork = Effect.fnUntraced(function* () {
            const { status } = getSnapshot();
            if (status === AiModelDownloadStatusEnum.DOWNLOADING && !isNetworkAllowed()) {
                yield* stopJob();
                enterWaiting();

                return;
            }
            if (isWaiting(status) && isNetworkAllowed()) {
                yield* startJob();

                return;
            }
            if (isWaiting(status)) {
                enterWaiting();
            }
        });

        const deleteModelFiles = (name: AiSubsystemNameEnum): void => {
            const { modelFile, tempFile } = resolveFiles(name);
            deleteIfExists(modelFile, tempFile);
            reportedTotals.delete(name);
            patchModel(name, { bytesWritten: 0, totalBytes: AI_MODEL_FILES[name].estimatedBytes, isComplete: false });
        };

        const readInitialProgress = (name: AiSubsystemNameEnum): AiModelDownloadProgressInterface => {
            const { modelFile, tempFile } = resolveFiles(name);
            if (isModelComplete(name)) {
                return { bytesWritten: modelFile.size, totalBytes: modelFile.size, isComplete: true };
            }
            const saved = state.resumes[name];
            if (isDefined(saved)) {
                if (isPositiveNumber(saved.reportedTotalBytes)) {
                    reportedTotals.set(name, saved.reportedTotalBytes);
                }

                return { bytesWritten: saved.bytesWritten, totalBytes: saved.totalBytes, isComplete: false };
            }
            const partialBytes = Platform.OS === 'android' && tempFile.exists ? tempFile.size : 0;

            return { bytesWritten: partialBytes, totalBytes: AI_MODEL_FILES[name].estimatedBytes, isComplete: false };
        };

        const migrateLegacyWhisperModel = (): void => {
            const { directory, modelFile } = resolveFiles(AiSubsystemNameEnum.STT);
            const legacyFile = new File(Paths.document, WHISPER_MODEL_FILENAME);
            if (legacyFile.exists && isPositiveNumber(legacyFile.size) && !modelFile.exists) {
                directory.create({ idempotent: true, intermediates: true });
                legacyFile.moveSync(modelFile);
            }
        };

        const readState = (): typeof StateSchema.Type =>
            stateFile.exists
                ? Option.getOrElse(Schema.decodeUnknownOption(StateSchema)(stateFile.textSync()), () => emptyState)
                : emptyState;

        const resolveInitialStatus = (): AiModelDownloadStatusEnum => {
            if (state.hold === AiModelDownloadHoldEnum.PAUSED) {
                return AiModelDownloadStatusEnum.PAUSED;
            }

            return state.hold === AiModelDownloadHoldEnum.DAMAGED
                ? AiModelDownloadStatusEnum.DAMAGED
                : AiModelDownloadStatusEnum.NOT_STARTED;
        };

        yield* logAndContinue(
            Effect.try({
                try: () => {
                    migrateLegacyWhisperModel();
                    state = readState();
                    patchSnapshot({
                        models: {
                            [AiSubsystemNameEnum.CHAT]: readInitialProgress(AiSubsystemNameEnum.CHAT),
                            [AiSubsystemNameEnum.EMBEDDING]: readInitialProgress(AiSubsystemNameEnum.EMBEDDING),
                            [AiSubsystemNameEnum.STT]: readInitialProgress(AiSubsystemNameEnum.STT)
                        },
                        status: resolveInitialStatus()
                    });
                },
                catch: cause => new AiModelDownloadError({ cause })
            })
        );
        yield* Effect.forkScoped(
            Stream.runForEach(networkService.changes, type =>
                control.withPermit(
                    Effect.suspend(() => {
                        networkType = type;

                        return applyNetwork();
                    })
                )
            )
        );

        return {
            completions: Stream.fromPubSub(completions),
            modelPath: (name: AiSubsystemNameEnum): string | null => (isModelComplete(name) ? resolveFiles(name).modelFile.uri : null),
            start: Effect.fn('AiModelDownloadService.start')(
                function* (enabled: ReadonlySet<AiSubsystemNameEnum>) {
                    enabledSubsystems = enabled;
                    const { status } = getSnapshot();
                    if (
                        isDefined(state.hold) ||
                        (status !== AiModelDownloadStatusEnum.NOT_STARTED && status !== AiModelDownloadStatusEnum.READY)
                    ) {
                        return;
                    }
                    if (enabledModels().every(isModelComplete)) {
                        patchSnapshot({ status: AiModelDownloadStatusEnum.READY });

                        return;
                    }
                    yield* startJob();
                },
                effect => control.withPermit(effect)
            ),
            resume: Effect.fn('AiModelDownloadService.resume')(
                function* () {
                    if (getSnapshot().status === AiModelDownloadStatusEnum.DOWNLOADING) {
                        return;
                    }
                    yield* writeState({ ...state, hold: null });
                    patchSnapshot({ status: AiModelDownloadStatusEnum.NOT_STARTED, missingBytes: 0 });
                    yield* startJob();
                },
                effect => control.withPermit(effect)
            ),
            pause: Effect.fn('AiModelDownloadService.pause')(
                function* () {
                    yield* stopJob();
                    yield* writeState({ ...state, hold: AiModelDownloadHoldEnum.PAUSED });
                    patchSnapshot({ status: AiModelDownloadStatusEnum.PAUSED, bytesPerSecond: 0 });
                },
                effect => control.withPermit(effect)
            ),
            suspend: Effect.fn('AiModelDownloadService.suspend')(
                function* () {
                    yield* stopJob();
                    const { status } = getSnapshot();
                    if (status === AiModelDownloadStatusEnum.DOWNLOADING || isWaiting(status)) {
                        patchSnapshot({ status: AiModelDownloadStatusEnum.NOT_STARTED, bytesPerSecond: 0 });
                    }
                },
                effect => control.withPermit(effect)
            ),
            cancel: Effect.fn('AiModelDownloadService.cancel')(
                function* () {
                    activeDownload?.task.cancel();
                    yield* FiberHandle.clear(job);
                    yield* Effect.sync(() => {
                        AI_MODEL_DOWNLOAD_ORDER.forEach(deleteModelFiles);
                    });
                    yield* writeState({ hold: AiModelDownloadHoldEnum.CANCELLED, resumes: {} });
                    patchSnapshot({
                        status: AiModelDownloadStatusEnum.NOT_STARTED,
                        missingBytes: 0,
                        bytesPerSecond: 0,
                        isMobileDataAllowed: false
                    });
                },
                effect => control.withPermit(effect)
            ),
            allowMobileData: Effect.fn('AiModelDownloadService.allowMobileData')(
                function* () {
                    patchSnapshot({ isMobileDataAllowed: true });
                    yield* applyNetwork();
                },
                effect => control.withPermit(effect)
            ),
            dismissNotice: Effect.sync(() => {
                patchSnapshot({ isNoticeDismissed: true });
            }),
            setWifiOnly: Effect.fn('AiModelDownloadService.setWifiOnly')(
                function* (value: boolean) {
                    isWifiOnly = value;
                    yield* applyNetwork();
                },
                effect => control.withPermit(effect)
            ),
            markDamaged: Effect.fn('AiModelDownloadService.markDamaged')(
                function* (name: AiSubsystemNameEnum) {
                    yield* stopJob();
                    yield* Effect.sync(() => {
                        deleteModelFiles(name);
                    });
                    yield* forgetResume(name);
                    yield* holdAsDamaged(name);
                },
                effect => control.withPermit(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(AiModelDownloadService, AiModelDownloadService.make).pipe(Layer.provide(NetworkService.layer));
}
