import { isIPv4, isIPv6 } from 'node:net';

const UNKNOWN_CLIENT = 'unknown';
const IPV6_GROUPS = 8;
const PREFIX_GROUPS = 4;
const IPV4_MAPPED_PREFIX = /^::ffff:/i;

/**
 * Buckets a client address for rate limiting. IPv6 clients are keyed by their
 * /64, because one subscriber usually controls the whole prefix and could
 * otherwise rotate source addresses to get a fresh bucket per request.
 * Anything that is not a valid address collapses into one shared bucket, since
 * `req.ip` may carry client-supplied text from `X-Forwarded-For`.
 */
export function clientKey(ip: string | undefined): string {
  if (!ip) {
    return UNKNOWN_CLIENT;
  }

  const address = ip.split('%')[0] ?? '';
  const mapped = address.replace(IPV4_MAPPED_PREFIX, '');
  if (isIPv4(mapped)) {
    return mapped;
  }
  return isIPv6(address) ? ipv6Prefix(address) : UNKNOWN_CLIENT;
}

function ipv6Prefix(address: string): string {
  const [head = '', tail] = address.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const missing = IPV6_GROUPS - headGroups.length - tailGroups.length;
  const groups =
    tail === undefined
      ? headGroups
      : [...headGroups, ...Array<string>(missing).fill('0'), ...tailGroups];

  const prefix = groups
    .slice(0, PREFIX_GROUPS)
    .map((group) => group.replace(/^0+(?=.)/, '').toLowerCase());
  return `${prefix.join(':')}::/64`;
}
