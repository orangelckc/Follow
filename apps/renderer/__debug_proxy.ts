globalThis["__DEBUG_PROXY__"] = true

const searchParams = new URLSearchParams(window.location.search)
const debugHost = searchParams.get("debug-host")

const resetSessionStorage = () => {
  sessionStorage.removeItem("debug-host")
}

const resetParams = searchParams.get("reset")
if (resetParams) {
  resetSessionStorage()
}

const debugHostInSessionStorage = sessionStorage.getItem("debug-host")

const host = debugHost || debugHostInSessionStorage || "https://localhost:2233"
if (debugHost) {
  sessionStorage.setItem("debug-host", debugHost)
}

const createRefreshRuntimeScript = `
import RefreshRuntime from "${host}/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
`
const $script = document.createElement("script")
$script.innerHTML = createRefreshRuntimeScript
$script.type = "module"
document.head.append($script)

fetch(`${host}`)
  .then((res) => res.text())
  .then((html) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    const scripts = doc.querySelectorAll("script")

    scripts.forEach((script) => {
      script.remove()
    })

    // header meta

    const $meta = doc.head.querySelectorAll("meta")
    $meta.forEach((meta) => {
      document.head.append(meta)
    })

    const $style = doc.head.querySelectorAll("style")
    $style.forEach((style) => {
      document.head.append(style)
    })

    document.body.innerHTML = doc.body.innerHTML

    scripts.forEach((script) => {
      const $script = document.createElement("script")
      $script.type = "module"
      $script.crossOrigin = script.crossOrigin

      if (script.src) {
        $script.src = new URL(
          script.src.startsWith("http") ? new URL(script.src).pathname : script.src,
          host,
        ).toString()
      } else if (script.innerHTML) {
        $script.innerHTML = script.innerHTML
      } else {
        return
      }

      document.body.append($script)
    })
  })

const injectScript = (apiUrl: string) => {
  const upstreamOrigin = window.location.origin
  const template = `function injectEnv(env2) {
for (const key in env2) {
if (env2[key] === void 0) continue;
globalThis["__followEnv"] ??= {};
globalThis["__followEnv"][key] = env2[key];
}
}
injectEnv({"VITE_API_URL":"${apiUrl}","VITE_EXTERNAL_API_URL":"${apiUrl}","VITE_WEB_URL":"${upstreamOrigin}"})`
  const $script = document.createElement("script")
  $script.innerHTML = template
  document.head.prepend($script)
}

injectScript(import.meta.env.VITE_API_URL)
