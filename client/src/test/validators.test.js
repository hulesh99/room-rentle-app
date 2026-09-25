import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  validateLogin,
  validateRegister,
} from '@/utils/validators';

describe('validators', () => {
  it('accepts valid emails and rejects bad ones', () => {
    expect(isValidEmail('renter@example.com')).toBe(true);
    expect(isValidEmail('nope@nope')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('requires at least 6 character passwords', () => {
    expect(isValidPassword('secret1')).toBe(true);
    expect(isValidPassword('abc')).toBe(false);
  });

  it('validates Indian mobile numbers', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('+91 9876543210')).toBe(true);
    expect(isValidPhone('+919876543210')).toBe(true);
    expect(isValidPhone('1234567890')).toBe(false);
    expect(isValidPhone('98765 43210')).toBe(false);
  });

  it('validateLogin flags missing credentials', () => {
    const errors = validateLogin({ email: 'bad', password: '' });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(validateLogin({ email: 'a@b.com', password: 'x' })).toEqual({});
  });

  it('validateRegister enforces name, role and password rules', () => {
    const errors = validateRegister({ name: 'A', email: 'a@b.com', password: 'longenough', role: 'GUEST' });
    expect(errors.name).toBeTruthy();
    expect(errors.role).toBeTruthy();
    expect(validateRegister({ name: 'Alice', email: 'a@b.com', password: 'longenough', role: 'OWNER' })).toEqual({});
  });
});
