/** Sub-solar point via the NOAA solar position formulas (accurate to well
 *  under a degree — plenty for a terminator on a small globe). */

import { zoneOffsetMinutes } from './time';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function century(ms: number): number {
  return (ms - Date.UTC(2000, 0, 1, 12)) / 315576e7;
}

/** [lng, lat] of the point where the sun is directly overhead. */
export function subsolarPoint(instantMs: number): [number, number] {
  const t = century(instantMs);

  const meanLng = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const meanAnom = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const ecc = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const eqCenter =
    Math.sin(meanAnom * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnom * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnom * RAD) * 0.000289;

  const omega = 125.04 - 1934.136 * t;
  const apparentLng = meanLng + eqCenter - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega * RAD);

  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(apparentLng * RAD)) * DEG;

  const y = Math.tan((obliquity / 2) * RAD) ** 2;
  const equationOfTimeMin =
    4 *
    DEG *
    (y * Math.sin(2 * meanLng * RAD) -
      2 * ecc * Math.sin(meanAnom * RAD) +
      4 * ecc * y * Math.sin(meanAnom * RAD) * Math.cos(2 * meanLng * RAD) -
      0.5 * y * y * Math.sin(4 * meanLng * RAD) -
      1.25 * ecc * ecc * Math.sin(2 * meanAnom * RAD));

  const date = new Date(instantMs);
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  let lng = 180 - (utcMinutes + equationOfTimeMin) / 4;
  lng = ((lng + 540) % 360) - 180;

  return [lng, declination];
}

/** Is the sun above the horizon at this point? (angular distance < 90°) */
export function isPointDaylight(lng: number, lat: number, instantMs: number): boolean {
  const [slng, slat] = subsolarPoint(instantMs);
  const cosDistance =
    Math.sin(lat * RAD) * Math.sin(slat * RAD) +
    Math.cos(lat * RAD) * Math.cos(slat * RAD) * Math.cos((lng - slng) * RAD);
  return cosDistance > 0;
}

/** Daylight for a zone without coordinates: use the zone's nominal longitude
 *  (offset × 15°/h) on the equator. Good enough to drive auto-dark. */
export function isZoneDaylight(zone: string, instantMs: number): boolean {
  return isPointDaylight(zoneOffsetMinutes(zone, instantMs) / 4, 0, instantMs);
}
