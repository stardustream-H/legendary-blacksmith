const CACHE_NAME = 'blacksmith-v1'

// 캐시할 핵심 파일 목록
const PRECACHE_URLS = [
  '/legendary-blacksmith/',
  '/legendary-blacksmith/index.html',
]

// 설치: 핵심 파일 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 요청 처리: 네트워크 우선, 실패시 캐시
self.addEventListener('fetch', (event) => {
  // POST 요청 등은 그냥 통과
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시에도 저장
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => {
        // 네트워크 실패시 캐시에서
        return caches.match(event.request)
      })
  )
})
