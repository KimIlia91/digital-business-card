import { clientKey } from './client-key.js';

describe('clientKey', () => {
  it.each([['203.0.113.7', '203.0.113.7']])(
    'keys an IPv4 address as itself (%s)',
    (ip, expected) => {
      expect(clientKey(ip)).toBe(expected);
    },
  );

  it.each(['::ffff:203.0.113.7', '::FFFF:203.0.113.7'])(
    'normalises the IPv4-mapped IPv6 address %s to plain IPv4',
    (ip) => {
      expect(clientKey(ip)).toBe('203.0.113.7');
    },
  );

  it.each([
    '2001:db8:1:2::1',
    '2001:db8:1:2:ffff:ffff:ffff:ffff',
    '2001:0db8:0001:0002:0:0:0:abc',
  ])('keys every address of one IPv6 /64 to the same bucket (%s)', (ip) => {
    expect(clientKey(ip)).toBe('2001:db8:1:2::/64');
  });

  it('separates different /64 prefixes', () => {
    expect(clientKey('2001:db8:1:3::1')).toBe('2001:db8:1:3::/64');
    expect(clientKey('2001:db8:1:3::1')).not.toBe(clientKey('2001:db8:1:2::1'));
  });

  it('expands a leading and a trailing compression', () => {
    expect(clientKey('::1')).toBe('0:0:0:0::/64');
    expect(clientKey('2001:db8::')).toBe('2001:db8:0:0::/64');
  });

  it('strips a zone index', () => {
    expect(clientKey('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
  });

  it.each([undefined, '', 'not-an-ip', '1.2.3.4.5', '::ffff:not-ip'])(
    'falls back to a shared bucket for a missing or unparsable address (%j)',
    (ip) => {
      expect(clientKey(ip)).toBe('unknown');
    },
  );
});
