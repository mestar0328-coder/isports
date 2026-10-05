const CACHE_NAME = "isports-cache-v1";

self.addEventListener("install", function () {
  console.log("iSports Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("iSports Service Worker activated");

  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function () {
  // Requests continue normally.
});