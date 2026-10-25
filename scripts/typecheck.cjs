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
    const projectIndex = compilerArguments.findIndex(argument => argument === '-p' || argument === '--project');
    const project = projectIndex === -1 ? 'tsconfig.json' : (compilerArguments[projectIndex + 1] ?? 'tsconfig.json');
    const compilerDirectory = path.dirname(require.resolve(`${compiler === 'tsrs' ? 'tsrs' : '@typescript/native'}/package.json`));
    const child = spawn(
        process.execPath,
        [
            path.join(compilerDirectory, 'bin', compiler === 'tsrs' ? 'tsrs' : 'tsc'),
            ...compilerArguments,
            '--tsBuildInfoFile',
            path.resolve('node_modules', '.cache', `typecheck-${compiler}-${path.basename(project, '.json')}.json`)
        ],
        { stdio: 'inherit' }
    );
    const signals = process.platform === 'win32' ? ['SIGINT', 'SIGTERM', 'SIGBREAK'] : ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'];
    const handlers = new Map();

    for (const signal of signals) {
        const handler = () => child.kill(signal);

        handlers.set(signal, handler);
        process.on(signal, handler);
    }

    child.on('error', error => {
        process.stderr.write(`[typecheck] ${error.message}\n`);
        process.exitCode = 1;
    });

    child.on('exit', (code, signal) => {
        for (const [forwardedSignal, handler] of handlers) {
            process.off(forwardedSignal, handler);
        }

        if (signal !== null) {
            process.kill(process.pid, signal);
            return;
        }

        process.exitCode = code ?? 1;
    });
};

module.exports = { selectCompiler };

if (require.main === module) {
    runTypecheck();
}
