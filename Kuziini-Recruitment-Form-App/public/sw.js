// Kuziini Recruitment Service Worker
// Handles push notifications for new applicants

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Kuziini Recruitment'
  const options = {
    body: data.body || 'Aplicare noua primita!',
    icon: '/logo-kuziini.png',
    badge: '/logo-kuziini.png',
    vibrate: [200, 100, 200],
    tag: 'kuziini-new-applicant',
    data: { url: data.url || '/#admin' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
