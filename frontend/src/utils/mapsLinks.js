/**
 * mapsLinks.js — Navigation deep link builders.
 *
 * Builds URLs for Google Maps and Apple Maps from an ordered
 * array of stops with lat/lng coordinates.
 */

/**
 * Build a Google Maps directions URL with origin, destination, and waypoints.
 * @param {Array<{lat: number, lng: number}>} stops — ordered stops
 * @returns {string} Google Maps directions URL
 */
export function buildGoogleMapsUrl(stops) {
    if (!stops || stops.length < 2) return '';

    const origin = `${stops[0].lat},${stops[0].lng}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
    const waypoints = stops
        .slice(1, -1)
        .map((s) => `${s.lat},${s.lng}`)
        .join('|');

    const params = new URLSearchParams({
        api: '1',
        origin,
        destination,
        travelmode: 'driving',
    });

    if (waypoints) {
        params.set('waypoints', waypoints);
    }

    return `https://www.google.com/maps/dir/?${params}`;
}

/**
 * Build an Apple Maps directions URL.
 * @param {Array<{lat: number, lng: number}>} stops — ordered stops
 * @returns {string} Apple Maps URL
 */
export function buildAppleMapsUrl(stops) {
    if (!stops || stops.length < 2) return '';

    const saddr = `${stops[0].lat},${stops[0].lng}`;
    const daddr = stops
        .slice(1)
        .map((s) => `${s.lat},${s.lng}`)
        .join('+to:');

    return `https://maps.apple.com/?saddr=${saddr}&daddr=${daddr}&dirflg=d`;
}

/**
 * Detect iOS devices for Apple Maps button visibility.
 * @returns {boolean}
 */
export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Programmatically open map URLs using an anchor tag click.
 * This bypasses mobile popup blockers that restrict window.open()
 * when the call isn't directly tied to a user gesture.
 * @param {string} url - The map URL to open
 */
export function openMapLink(url) {
    if (!url) return;

    // Detect if running as a PWA (standalone mode)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isPWA) {
        // In PWA standalone mode, opening in _blank often doesn't work correctly
        // and can cause the app to get stuck. Direct navigation works better.
        window.location.href = url;
    } else {
        // In standard browser mode, window.open is usually allowed when tied to a user gesture
        window.open(url, '_blank');
    }
}
