import { describe, expect, it } from 'vitest';
import { formatINR, prettyLabel } from '@/utils/format';
import { getInitials, getFirstName, dashboardPath } from '@/utils/helpers';

describe('formatINR', () => {
  it('formats numbers as Indian currency without decimals', () => {
    expect(formatINR(12000)).toContain('12,000');
  });

  it('falls back to zero for invalid input', () => {
    expect(formatINR(undefined)).toBe(formatINR(0));
    expect(formatINR('abc')).toBe(formatINR(0));
  });
});

describe('prettyLabel', () => {
  it('converts snake_case to Title Case', () => {
    expect(prettyLabel('SINGLE_ROOM')).toBe('Single Room');
  });

  it('handles empty values', () => {
    expect(prettyLabel()).toBe('');
  });
});

describe('helpers', () => {
  it('builds initials from a name', () => {
    expect(getInitials('Hulesh D')).toBe('HD');
    expect(getInitials('madara')).toBe('M');
    expect(getInitials('')).toBe('?');
  });

  it('extracts the first name', () => {
    expect(getFirstName('Itachi Uchiha')).toBe('Itachi');
    expect(getFirstName('  ')).toBe('');
  });

  it('routes each role to its dashboard', () => {
    expect(dashboardPath('OWNER')).toBe('/owner/dashboard');
    expect(dashboardPath('RENTER')).toBe('/renter/dashboard');
  });
});
