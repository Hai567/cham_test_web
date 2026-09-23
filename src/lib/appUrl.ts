declare const __HASH_ROUTER__: boolean;

export const USE_HASH_ROUTER = typeof __HASH_ROUTER__ !== 'undefined' && __HASH_ROUTER__;

/** URL tuyệt đối tới một route của app (dùng cho link AR/QR). */
export function appUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const { origin, pathname } = window.location;
  if (USE_HASH_ROUTER) return `${origin}${pathname}#${clean}`;
  return `${origin}${clean}`;
}
