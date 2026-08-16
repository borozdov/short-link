import fc from 'fast-check';
import { LinkifyIt } from 'linkify-it';
import { describe, expect, it } from 'vitest';
import { extractUrls, isOwnDomainUrl, replaceUrls } from '../../src/domains/links/url-extraction.js';

// Same options as the module under test, used only to keep generated "plain text"
// filler from accidentally looking like a URL on its own.
const linkifyForFiltering = new LinkifyIt({ fuzzyEmail: false, fuzzyLink: true });

interface Segment {
  type: 'url' | 'text';
  value: string;
}

// fc.webUrl() can generate trailing punctuation (e.g. a path ending in "!") that
// linkify-it deliberately trims off a real match as not part of the URL — that's
// correct behavior on real text, not a bug, but it means such a candidate isn't a
// single lossless match. Keep only candidates extractUrls matches as themselves in
// full, so the "expected" string built from generator bookkeeping below stays valid.
const urlSegment: fc.Arbitrary<Segment> = fc
  .webUrl()
  .filter((url) => {
    const matches = extractUrls(url);
    return matches.length === 1 && matches[0].raw === url;
  })
  .map((value) => ({ type: 'url', value }));

const textSegment: fc.Arbitrary<Segment> = fc
  .string({ minLength: 0, maxLength: 12 })
  .filter((value) => !linkifyForFiltering.test(value))
  .map((value) => ({ type: 'text', value }));

// Segments are joined with a literal space, so a URL segment (always starting with
// an explicit http(s):// scheme, per fc.webUrl()'s default) never glues onto a
// neighboring segment into a different match.
const segmentsArbitrary = fc.array(fc.oneof(urlSegment, textSegment), { minLength: 0, maxLength: 15 });

describe('extractUrls / replaceUrls — property-based', () => {
  it('replaces exactly the generated URL segments and leaves text segments untouched', () => {
    fc.assert(
      fc.property(segmentsArbitrary, (segments) => {
        const text = segments.map((segment) => segment.value).join(' ');
        const matches = extractUrls(text);

        const replaced = replaceUrls(text, matches, () => '@@REPLACED@@');

        // Ground truth built from the generator's own bookkeeping, not from
        // extractUrls' output — independently checks both functions at once.
        const expected = segments
          .map((segment) => (segment.type === 'url' ? '@@REPLACED@@' : segment.value))
          .join(' ');

        expect(replaced).toBe(expected);
      }),
    );
  });

  it('returns the original text unchanged when every match is left unresolved', () => {
    fc.assert(
      fc.property(segmentsArbitrary, (segments) => {
        const text = segments.map((segment) => segment.value).join(' ');
        const matches = extractUrls(text);

        expect(replaceUrls(text, matches, () => undefined)).toBe(text);
      }),
    );
  });

  it('finds no matches in text with no URL segments', () => {
    fc.assert(
      fc.property(
        fc.array(textSegment, { minLength: 0, maxLength: 15 }),
        (segments) => {
          const text = segments.map((segment) => segment.value).join(' ');
          expect(extractUrls(text)).toEqual([]);
        },
      ),
    );
  });
});

describe('isOwnDomainUrl', () => {
  it('matches when the host is identical to the base link domain', () => {
    expect(isOwnDomainUrl('http://localhost:4000/abc1234', 'http://localhost:4000')).toBe(true);
  });

  it('does not match a different host', () => {
    expect(isOwnDomainUrl('https://example.com/a', 'http://localhost:4000')).toBe(false);
  });

  it('ignores scheme and path when comparing hosts', () => {
    expect(isOwnDomainUrl('https://link.borozdov.ru/xyz?utm=1', 'http://link.borozdov.ru')).toBe(true);
  });

  it('returns false for an unparseable url instead of throwing', () => {
    expect(isOwnDomainUrl('not-a-url', 'http://localhost:4000')).toBe(false);
  });
});
