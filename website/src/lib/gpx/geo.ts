// Geodesic distance on the WGS 84 ellipsoid. Author: A097MPRUS.
//
// Vincenty's inverse formula (1975) is accurate to well under a millimetre for the short steps
// between GPS points. For nearly antipodal points, where it may not converge, the great-circle
// distance on the mean Earth radius is used instead (error below 0.5 %).
// The desktop applications use the great-circle distance for every step; the two methods differ
// by up to about 0.5 % depending on latitude and direction.

const A = 6_378_137;
const F = 1 / 298.257223563;
const B = A * (1 - F);
const MEAN_RADIUS = 6_371_008.8;
const RAD = Math.PI / 180;

export function greatCircle(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p = (lat2 - lat1) * RAD;
  const l = (lon2 - lon1) * RAD;
  const h =
    Math.sin(p / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(l / 2) ** 2;
  return (
    MEAN_RADIUS *
    2 *
    Math.atan2(Math.sqrt(Math.min(1, Math.max(0, h))), Math.sqrt(Math.max(0, 1 - h)))
  );
}

/** Distance in metres between two points on the WGS 84 ellipsoid. */
export function geodesic(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  let dLon = lon2 - lon1;
  if (dLon > 180) dLon -= 360;
  else if (dLon < -180) dLon += 360;
  const L = dLon * RAD;
  const U1 = Math.atan((1 - F) * Math.tan(lat1 * RAD));
  const U2 = Math.atan((1 - F) * Math.tan(lat2 * RAD));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  let lambda = L;
  for (let iter = 0; iter < 100; iter++) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    const sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2,
    );
    if (sinSigma === 0) return 0;
    const cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    const sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    const cos2Alpha = 1 - sinAlpha * sinAlpha;
    const cos2SigmaM = cos2Alpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cos2Alpha : 0;
    const C = (F / 16) * cos2Alpha * (4 + F * (4 - 3 * cos2Alpha));
    const previous = lambda;
    lambda =
      L +
      (1 - C) *
        F *
        sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    if (Math.abs(lambda - previous) < 1e-12) {
      const u2 = (cos2Alpha * (A * A - B * B)) / (B * B);
      const bigA = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
      const bigB = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
      const deltaSigma =
        bigB *
        sinSigma *
        (cos2SigmaM +
          (bigB / 4) *
            (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
              (bigB / 6) *
                cos2SigmaM *
                (-3 + 4 * sinSigma * sinSigma) *
                (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      return B * bigA * (sigma - deltaSigma);
    }
  }
  return greatCircle(lat1, lon1, lat2, lon2);
}
