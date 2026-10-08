const DEFAULT_IMAGE = '/pwa-512.png'

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    const [, key, keyValue] = selector.match(/\[(name|property)="([^"]+)"\]/) ?? []
    if (key && keyValue) element.setAttribute(key, keyValue)
    document.head.append(element)
  }
  element.setAttribute(attribute, value)
}

export function setPageMetadata({ title, description, path, image = DEFAULT_IMAGE, noIndex = false }) {
  document.title = title
  setMeta('meta[name="description"]', 'content', description)
  setMeta('meta[name="robots"]', 'content', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  setMeta('meta[property="og:type"]', 'content', 'website')
  setMeta('meta[property="og:site_name"]', 'content', 'ONGD IDA')
  setMeta('meta[property="og:locale"]', 'content', 'fr_CD')
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', description)
  setMeta('meta[property="og:image"]', 'content', new URL(image, window.location.origin).href)
  setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'content', title)
  setMeta('meta[name="twitter:description"]', 'content', description)
  setMeta('meta[name="twitter:image"]', 'content', new URL(image, window.location.origin).href)

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (noIndex) {
    canonical?.remove()
    return
  }
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = new URL(path, window.location.origin).href
  setMeta('meta[property="og:url"]', 'content', canonical.href)
}
