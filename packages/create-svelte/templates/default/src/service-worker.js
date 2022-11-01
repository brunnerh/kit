// @ts-nocheck Official TS Service Worker typings are still a work in progress.
import { build, files, version } from '$service-worker';

// This service worker eagerly loads and caches all static files and assets of the application.
// It also caches visited pages, so that once you visited a page, it can be accessed offline.
// The exception is the Sverdle game as that's highly dynamic and doesn't make sense to be cached.

// Give the current service worker instance a unique cache name
const CACHE_NAME = `cache-${version}`;
// In this simple example, we just cache all files
const to_cache = build.concat(files);

self.addEventListener('install', (event) => {
	// Create new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE_NAME);
		await cache.addAll(to_cache);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		const keyList = await caches.keys();
		const cachesToDelete = keyList.filter((key) => key !== CACHE_NAME);
		await Promise.all(cachesToDelete.map((key) => caches.delete(key)));
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// Try to get the response from the cache, add to cache if not found
	async function addToCache(request, response) {
		const cache = await caches.open(CACHE_NAME);
		await cache.put(request, response);
	}

	async function cacheFirst(request) {
		const responseFromCache = await caches.match(request);
		if (responseFromCache) {
			return responseFromCache;
		}
		const response = await fetch(request);
		// Don't cache Sverdle game interactions, they are dynamic
		if (!request.url.includes('sverdle')) {
			addToCache(request, response.clone());
		}
		return response;
	}

	event.respondWith(cacheFirst(event.request));
});
