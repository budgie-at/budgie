import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const root = '/Users/macstudio/projects/budgie-argent/tests/app-tests';
const sourceRoot = path.join(root, 'flows');
const outputRoot = path.join(root, 'argent-flows');
const APP_ID = 'com.vitalyiegorov.budgie.e2e';
const defaults = {
  APP_ID,
  E2E_RUN_TOKEN: 'argent',
  RECURRING_EMPTY_DAY: '28',
  E2E_CSV_FIXTURES_URI: 'file:///tmp/budgie-e2e-fixtures',
  E2E_DB_FIXTURES_URI: 'file:///tmp/budgie-e2e-fixtures',
  DATABASE_FIXTURE_SEEDED: 'false',
  FILE_PICKER_INITIAL_SCROLL_SHIFT: '80',
  FILE_PICKER_SCROLL_SHIFT: '60',
  FILE_PICKER_REPEAT_TAP: 'false',
  FILE_PICKER_SEARCH_TEXT: '',
};

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

const topFiles = fs.readdirSync(sourceRoot)
  .filter(name => name.endsWith('.flow.yaml'))
  .sort();

function readLegacyFlow(file) {
  const source = fs.readFileSync(file, 'utf8');
  const docs = source.split(/^---\s*$/m);
  const header = YAML.parse(docs.length > 1 ? docs[0] : '') || {};
  const steps = YAML.parse(docs.length > 1 ? docs.slice(1).join('---\n') : source) || [];
  return { header, steps };
}

function scalar(value, env) {
  if (typeof value !== 'string') return value;
  const exact = value.match(/^\$\{([A-Z_][A-Z0-9_]*)\}$/);
  if (exact) return env[exact[1]] ?? defaults[exact[1]] ?? `argent-${exact[1].toLowerCase()}`;
  return value.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    const fallback = expr.match(/^([A-Z_][A-Z0-9_]*)\s*\|\|\s*['"]([^'"]*)['"]$/);
    if (fallback) return String(env[fallback[1]] ?? defaults[fallback[1]] ?? fallback[2]);
    const variableChain = expr.split(/\s*\|\|\s*/).map(part => part.trim());
    if (variableChain.length > 1 && variableChain.every(part => /^[A-Z_][A-Z0-9_]*$/.test(part))) {
      for (const key of variableChain) {
        const candidate = env[key] ?? defaults[key];
        if (candidate !== undefined && candidate !== '') return String(candidate);
      }
      return '';
    }
    const key = expr.trim();
    return String(env[key] ?? defaults[key] ?? `argent-${key.toLowerCase()}`);
  });
}

function deep(value, env) {
  if (Array.isArray(value)) return value.map(item => deep(item, env));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, deep(v, env)]));
  return scalar(value, env);
}

function condition(expr, env) {
  if (typeof expr === 'boolean') return expr;
  const text = String(expr).replace(/^\$\{|\}$/g, '').trim();
  let match = text.match(/^([A-Z_][A-Z0-9_]*)\s*(==|!=)\s*['"]([^'"]*)['"]$/);
  if (match) {
    const actual = String(env[match[1]] ?? defaults[match[1]] ?? '');
    return match[2] === '==' ? actual === match[3] : actual !== match[3];
  }
  return Boolean(scalar(String(expr), env));
}

function selector(raw, env) {
  const value = deep(raw, env);
  if (typeof value === 'string') return { text: value };
  if (!value || typeof value !== 'object') return { text: String(value) };
  const out = {};
  if (value.id !== undefined) out.id = value.id;
  if (value.text !== undefined) out.text = value.text;
  if (Object.keys(out).length === 0) {
    const candidate = value.visible ?? value.notVisible;
    return selector(candidate, env);
  }
  return out;
}

function visibilityCondition(raw, env) {
  const value = deep(raw, env);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('visible' in value) return { visible: selector(value.visible, env) };
    if ('notVisible' in value) return { hidden: selector(value.notVisible, env) };
  }
  return { visible: selector(value, env) };
}

function swipeArgs(body) {
  const direction = String(body?.direction || 'UP').toUpperCase();
  const coords = {
    UP: [0.5, 0.78, 0.5, 0.25], DOWN: [0.5, 0.25, 0.5, 0.78],
    LEFT: [0.82, 0.5, 0.18, 0.5], RIGHT: [0.18, 0.5, 0.82, 0.5],
  }[direction] || [0.5, 0.78, 0.5, 0.25];
  return { fromX: coords[0], fromY: coords[1], toX: coords[2], toY: coords[3], durationMs: body?.duration || 350, settle: true };
}

function parseRun(value) {
  if (typeof value === 'string') return { file: value, env: {}, when: undefined, commands: undefined };
  return { file: value?.file, env: value?.env || {}, when: value?.when, commands: value?.commands };
}

function expand(file, inheritedEnv, stack = []) {
  const absolute = path.resolve(file);
  if (stack.includes(absolute)) throw new Error(`recursive runFlow: ${[...stack, absolute].join(' -> ')}`);
  const { header, steps } = readLegacyFlow(absolute);
  const env = { ...defaults, ...inheritedEnv };
  for (const [key, value] of Object.entries(header.env || {})) env[key] = scalar(value, env);
  return convertSteps(steps, env, absolute, [...stack, absolute]);
}

function convertSteps(steps, env, currentFile, stack) {
  const out = [];
  for (const rawStep of steps || []) {
    if (rawStep === null || rawStep === undefined) continue;
    if (typeof rawStep === 'string') {
      if (rawStep === 'waitForAnimationToEnd') out.push({ await: { idle: true } });
      else if (rawStep === 'stopApp') out.push({ echo: 'App process stop requested; the following launch performs a clean restart.' });
      continue;
    }
    if ('runFlow' in rawStep) {
      const run = parseRun(rawStep.runFlow);
      const childEnv = { ...env };
      for (const [key, value] of Object.entries(run.env || {})) childEnv[key] = scalar(value, childEnv);
      const sourceSteps = run.commands
        ? convertSteps(run.commands, childEnv, currentFile, stack)
        : expand(path.resolve(path.dirname(currentFile), run.file), childEnv, stack);
      const when = run.when || rawStep.when;
      if (!when) out.push(...sourceSteps);
      else if ('true' in when) { if (condition(when.true, childEnv)) out.push(...sourceSteps); }
      else if (sourceSteps.length > 0) out.push({ when: visibilityCondition(when, childEnv), steps: sourceSteps });
      continue;
    }
    if ('retry' in rawStep) {
      const body = rawStep.retry || {};
      out.push({ echo: `Native recovery attempt (migrated from retry, max ${body.maxRetries ?? 1})` });
      out.push(...convertSteps(body.commands || [], env, currentFile, stack));
      continue;
    }
    if ('tapOn' in rawStep) { out.push({ tap: selector(rawStep.tapOn, env) }); continue; }
    if ('longPressOn' in rawStep) { out.push({ 'long-press': selector(rawStep.longPressOn, env) }); continue; }
    if ('inputText' in rawStep) { out.push({ tool: 'keyboard', args: { text: scalar(rawStep.inputText, env) } }); continue; }
    if ('eraseText' in rawStep) {
      const count = Number(rawStep.eraseText) || 1;
      for (let i=0; i<count; i++) out.push({ tool: 'keyboard', args: { key: 'backspace' } });
      continue;
    }
    if ('pressKey' in rawStep) { out.push({ tool: 'keyboard', args: { key: String(rawStep.pressKey).toLowerCase() } }); continue; }
    if ('waitForAnimationToEnd' in rawStep) { out.push({ await: { idle: true } }); continue; }
    if ('extendedWaitUntil' in rawStep) {
      const b = rawStep.extendedWaitUntil || {};
      out.push({ await: { ...visibilityCondition(b, env), ...(b.timeout ? { timeout: b.timeout } : {}) } });
      continue;
    }
    if ('assertVisible' in rawStep) { out.push({ assert: { visible: selector(rawStep.assertVisible, env) } }); continue; }
    if ('assertNotVisible' in rawStep) { out.push({ assert: { hidden: selector(rawStep.assertNotVisible, env) } }); continue; }
    if ('scrollUntilVisible' in rawStep) {
      const b = rawStep.scrollUntilVisible || {};
      out.push({ 'scroll-to': { target: selector(b.element, env), direction: String(b.direction || 'DOWN').toLowerCase() } });
      continue;
    }
    if ('swipe' in rawStep) { out.push({ tool: 'gesture-swipe', args: swipeArgs(rawStep.swipe || {}) }); continue; }
    if ('openLink' in rawStep) {
      const b = rawStep.openLink;
      out.push({ tool: 'open-url', args: { url: scalar(typeof b === 'string' ? b : b.link, env) } });
      continue;
    }
    if ('launchApp' in rawStep) { out.push({ launch: APP_ID }); continue; }
    if ('stopApp' in rawStep) { out.push({ echo: 'App process stop requested; the following launch performs a clean restart.' }); continue; }
    if ('evalScript' in rawStep) { out.push({ echo: `Phase: ${scalar(rawStep.evalScript, env)}` }); continue; }
    if ('takeScreenshot' in rawStep) { out.push({ echo: `Screenshot checkpoint: ${scalar(rawStep.takeScreenshot, env)}` }); continue; }
    throw new Error(`${path.relative(sourceRoot,currentFile)}: unsupported step ${JSON.stringify(rawStep)}`);
  }
  return out;
}

const nameMap = new Map();
for (const original of topFiles) {
  const name = original.replace(/\.flow\.yaml$/, '').replace(/[^A-Za-z0-9_-]+/g, '-');
  nameMap.set(original, `${name}.yaml`);
  const body = expand(path.join(sourceRoot, original), defaults);
  const steps = body[0]?.launch ? body : [{ launch: APP_ID }, ...body];
  fs.writeFileSync(path.join(outputRoot, `${name}.yaml`), YAML.stringify({ steps }, { lineWidth: 0 }));
}

for (const shardFile of fs.readdirSync(path.join(root, 'shards')).filter(f => /^shard-\d+\.txt$/.test(f))) {
  const lines = fs.readFileSync(path.join(root, 'shards', shardFile), 'utf8').split(/\r?\n/).filter(Boolean);
  fs.writeFileSync(path.join(root, 'shards', shardFile), lines.map(line => nameMap.get(line) || line).join('\n') + '\n');
}
console.log(`Converted ${topFiles.length} top-level legacy flows into self-contained Argent flows.`);
