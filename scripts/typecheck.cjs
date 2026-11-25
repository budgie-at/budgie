const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const path = require('node:path');

const isPlatformInstalled = (compilerRequire, platformPackage) => {
    try {
        compilerRequire.resolve(`${platformPackage}/package.json`);
        return true;
    } catch {
        return false;
    }
};

const selectCompiler = (platform, architecture, forceNative = false) => {
    const tsrsRequire = createRequire(require.resolve('tsrs/package.json'));
    const nativeRequire = createRequire(require.resolve('@typescript/native/package.json'));
    const tsrsPlatform = tsrsRequire('./lib/platform.js').getPlatformPackageName(platform, architecture);
    const nativePlatform = `@typescript/typescript-${platform}-${architecture}`;

    if (
        !forceNative &&
        Object.hasOwn(tsrsRequire('./package.json').optionalDependencies, tsrsPlatform) &&
        isPlatformInstalled(tsrsRequire, tsrsPlatform)
    ) {
        return 'tsrs';
    }

    if (
        Object.hasOwn(nativeRequire('./package.json').optionalDependencies, nativePlatform) &&
        isPlatformInstalled(nativeRequire, nativePlatform)
    ) {
        return 'native';
    }

    return undefined;
};

const parseCompilerArguments = compilerArguments => {
    const projects = [];
    const sharedArguments = [];

    for (let index = 0; index < compilerArguments.length; index += 1) {
        const argument = compilerArguments[index];

        if (argument === '-p' || argument === '--project') {
            const nextArgument = compilerArguments[index + 1];

            if (nextArgument !== undefined) {
                projects.push(nextArgument);
                index += 1;
            }
        } else if (argument.startsWith('--project=')) {
            projects.push(argument.slice('--project='.length));
        } else {
            sharedArguments.push(argument);
        }
    }

    return { projects, sharedArguments };
};

const getBuildInfoPath = (compiler, project) =>
    path.resolve('node_modules', '.cache', `typecheck-${compiler}-${path.basename(project, '.json')}.json`);

const runTypecheck = () => {
    const forceNative = process.argv[2] === '--native';
    const compiler = selectCompiler(process.platform, process.arch, forceNative);

    if (compiler === undefined) {
        process.stderr.write(`[typecheck] No installed compiler supports ${process.platform}-${process.arch}.\n`);
        process.exitCode = 1;
        return;
    }

    if (compiler === 'native' && !forceNative) {
        process.stderr.write(`[typecheck] TSRS has no binary for ${process.platform}-${process.arch}; using native TypeScript.\n`);
    }

    const compilerArguments = process.argv.slice(forceNative ? 3 : 2);
    const compilerDirectory = path.dirname(require.resolve(`${compiler === 'tsrs' ? 'tsrs' : '@typescript/native'}/package.json`));
    const compilerBinary = path.join(compilerDirectory, 'bin', compiler === 'tsrs' ? 'tsrs' : 'tsc');
    const { projects, sharedArguments } = parseCompilerArguments(compilerArguments);
    const invocations =
        projects.length <= 1
            ? [[...compilerArguments, '--tsBuildInfoFile', getBuildInfoPath(compiler, projects[0] ?? 'tsconfig.json')]]
            : projects.map(project => [...sharedArguments, '-p', project, '--tsBuildInfoFile', getBuildInfoPath(compiler, project)]);

    const signals = process.platform === 'win32' ? ['SIGINT', 'SIGTERM', 'SIGBREAK'] : ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'];
    const children = [];
    const handlers = new Map();
    let pendingCount = invocations.length;
    let firstFailureCode = 0;
    let firstSignal = null;

    const cleanupSignalHandlers = () => {
        for (const [forwardedSignal, handler] of handlers) {
            process.off(forwardedSignal, handler);
        }
    };

    const handleChildSettled = () => {
        pendingCount -= 1;

        if (pendingCount === 0) {
            cleanupSignalHandlers();

            if (firstSignal !== null) {
                process.kill(process.pid, firstSignal);
                return;
            }

            process.exitCode = firstFailureCode;
        }
    };

    for (const args of invocations) {
        const child = spawn(process.execPath, [compilerBinary, ...args], { stdio: 'inherit' });
        let settled = false;

        children.push(child);

        child.on('error', error => {
            if (settled) {
                return;
            }

            settled = true;
            process.stderr.write(`[typecheck] ${error.message}\n`);

            if (firstFailureCode === 0) {
                firstFailureCode = 1;
            }

            handleChildSettled();
        });

        child.on('exit', (code, signal) => {
            if (settled) {
                return;
            }

            settled = true;

            if (signal !== null && firstSignal === null) {
                firstSignal = signal;
            } else if (code !== 0 && firstFailureCode === 0) {
                firstFailureCode = code ?? 1;
            }

            handleChildSettled();
        });
    }

    for (const signal of signals) {
        const handler = () => {
            for (const child of children) {
                if (child.exitCode === null && child.signalCode === null) {
                    child.kill(signal);
                }
            }
        };

        handlers.set(signal, handler);
        process.on(signal, handler);
    }
};

module.exports = { selectCompiler };

if (require.main === module) {
    runTypecheck();
}
