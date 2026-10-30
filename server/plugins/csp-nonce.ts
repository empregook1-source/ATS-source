function appendNonceToScripts(tags: string[], nonce: string) {
  return tags.map(tag =>
    tag.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`),
  )
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = (event.context as { cspNonce?: string }).cspNonce
    if (!nonce) return

    html.head = appendNonceToScripts(html.head, nonce)
    html.bodyPrepend = appendNonceToScripts(html.bodyPrepend, nonce)
    html.bodyAppend = appendNonceToScripts(html.bodyAppend, nonce)
  })
})
