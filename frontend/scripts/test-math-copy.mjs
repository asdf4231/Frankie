/** Browser + native clipboard tests, using Chromium CDP and Node's WebSocket.
 * No browser-driver npm dependency or backend/course account is required.
 * Default: bundle the real React renderer with Vite. --core: test only the DOM
 * utilities (also useful for an offline environment with a preinstalled KaTeX).
 */
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const frontend = dirname(dirname(fileURLToPath(import.meta.url)))
const coreOnly = process.argv.includes('--core')
const candidates = [process.env.CHROMIUM_PATH, 'chromium', 'chromium-browser', 'google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean)
const executable = candidates.find((path) => spawnSync(path, ['--version'], { stdio: 'ignore' }).status === 0)
if (!executable) throw new Error('Chromium/Chrome not found. Set CHROMIUM_PATH to its executable.')

async function bundle() {
  if (!coreOnly) {
    const { build } = await import('vite')
    const { default: react } = await import('@vitejs/plugin-react')
    const result = await build({
      root: frontend, configFile: false, plugins: [react()], logLevel: 'warn',
      define: { 'process.env.NODE_ENV': JSON.stringify('development') },
      build: { write: false, minify: false, lib: { entry: join(frontend, 'tests/math-copy.browser.tsx'), formats: ['iife'], name: 'MathCopyTests' } },
    })
    const outputs = Array.isArray(result) ? result.flatMap((r) => r.output) : result.output
    return {
      js: outputs.filter((o) => o.type === 'chunk').map((o) => o.code).join('\n'),
      css: outputs.filter((o) => o.type === 'asset' && o.fileName.endsWith('.css')).map((o) => String(o.source)).join('\n'),
    }
  }
  const ts = require('typescript')
  const katexPath = process.env.KATEX_JS_PATH || require.resolve('katex/dist/katex.min.js')
  const golden = JSON.parse(await readFile(join(frontend, 'tests/fixtures/math-copy.json'), 'utf8'))
  const files = ['src/lib/mathText', 'src/lib/mathCopy', 'tests/math-copy.cases', 'tests/math-copy.native']
  let js = await readFile(katexPath, 'utf8')
  js += '\n;window.__modules = {};\n'
  for (const file of files) {
    const { outputText } = ts.transpileModule(await readFile(join(frontend, file + '.ts'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS } })
    js += `(function(exports,require){${outputText}\n})(window.__modules[${JSON.stringify('/' + file)}]={}, s=>window.__modules[new URL(s,${JSON.stringify('https://test/' + file)}).pathname]);\n`
  }
  js += `const render=(latex,displayMode=false)=>katex.renderToString(latex,{displayMode,strict:false});
    window.__mathCopyVersions={katex:katex.version};
    window.__mathCopyResults=Promise.resolve(window.__modules['/tests/math-copy.cases'].runMathCopyCases(render,${JSON.stringify(golden)}));
    window.__mathCopyNative=s=>window.__modules['/tests/math-copy.native'].nativeFixture(render,s);
    window.__mathCopyNativeResult=window.__modules['/tests/math-copy.native'].nativeResult;`
  const cssPath = process.env.KATEX_CSS_PATH || (!process.env.KATEX_JS_PATH ? require.resolve('katex/dist/katex.min.css') : null)
  const css = (cssPath ? await readFile(cssPath, 'utf8') : '') + '\n' + await readFile(join(frontend, 'src/components/Markdown.css'), 'utf8')
  return { js, css }
}

const { js, css } = await bundle()
const profile = await mkdtemp(join(tmpdir(), 'frankie-math-copy-'))
let browser, socket
let sequence = 0
const pending = new Map()
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
})
const timeout = setTimeout(() => { console.error('Math-copy browser test timed out.'); browser?.kill(); process.exitCode = 1 }, 120_000)
try {
  browser = spawn(executable, ['--headless', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`, ...(process.env.CHROMIUM_NO_SANDBOX === '1' ? ['--no-sandbox'] : []), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = ''
    browser.stderr.on('data', (data) => { stderr += data; const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]) })
    browser.once('error', reject)
    browser.once('exit', (code) => reject(new Error(`Chromium exited (${code}): ${stderr}`)))
  })
  socket = new WebSocket(endpoint)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    const request = pending.get(message.id)
    if (request) { pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result) }
  }
  socket.onclose = () => { for (const { reject } of pending.values()) reject(new Error('Browser connection closed')); pending.clear() }
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const cdp = (method, params) => send(method, params, sessionId)
  const evaluate = async (expression) => {
    const response = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
    return response.result.value
  }
  const { frameTree } = await cdp('Page.getFrameTree')
  await cdp('Page.setDocumentContent', { frameId: frameTree.frame.id, html: '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>' })
  await evaluate(`{ const style=document.createElement('style');style.textContent=${JSON.stringify(css)};document.head.append(style) }`)
  await evaluate(js)
  const results = await evaluate('window.__mathCopyResults')
  await cdp('Page.bringToFront')
  const shortcut = async (letter) => {
    const modifiers = process.platform === 'darwin' ? 4 : 2
    const params = { key: letter, code: `Key${letter.toUpperCase()}`, windowsVirtualKeyCode: letter.toUpperCase().charCodeAt(0), modifiers }
    await cdp('Input.dispatchKeyEvent', { ...params, type: 'keyDown' })
    await cdp('Input.dispatchKeyEvent', { ...params, type: 'keyUp' })
  }
  for (const scenario of ['mixed', 'display', 'ordinary']) {
    try {
      await evaluate(`window.__mathCopyNative(${JSON.stringify(scenario)})`)
      await shortcut('c')
      await evaluate("document.getElementById('native-plain').focus()")
      await shortcut('v')
      await evaluate("document.getElementById('native-rich').focus()")
      await shortcut('v')
      await evaluate('new Promise(resolve=>setTimeout(resolve,100))')
      await evaluate(`window.__mathCopyNativeResult(${JSON.stringify(scenario)})`)
      results.push({ name: `Native keyboard copy/paste: ${scenario}` })
    } catch (error) { results.push({ name: `Native keyboard copy/paste: ${scenario}`, error: String(error) }) }
  }
  const failures = results.filter((r) => r.error)
  console.log(JSON.stringify({ mode: coreOnly ? 'core' : 'MessageContent integration', browser: (await send('Browser.getVersion')).product, node: process.version, ...(await evaluate('window.__mathCopyVersions')), passed: results.length - failures.length, total: results.length, failures }, null, 2))
  if (failures.length) process.exitCode = 1
} finally {
  clearTimeout(timeout)
  socket?.close()
  if (browser && browser.exitCode === null && browser.signalCode === null) {
    browser.kill()
    await new Promise((resolve) => browser.once('exit', resolve))
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 3 })
}
