import { z } from 'zod';

const MIN_LENGTH = 6;
const FIELD_VALIDATION = {
  TEST: {
    SPECIAL_CHAR: (value: string) => /[-._!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]+/.test(value),
    LOWERCASE: (value: string) => /[a-z]/.test(value),
    UPPERCASE: (value: string) => /[A-Z]/.test(value),
    NUMBER: (value: string) => /.*[0-9].*/.test(value),
  },
  MSG_KEY: {
    MIN_LEN: 'minLength',
    SPECIAL_CHAR: 'specialCharacter',
    LOWERCASE: 'lowerCase',
    UPPERCASE: 'upperCase',
    NUMBER: 'number',
  },
};

export const passwordPatterns = z
  .string()
  .min(MIN_LENGTH, {
    message: FIELD_VALIDATION.MSG_KEY.MIN_LEN,
  })
  .refine(FIELD_VALIDATION.TEST.SPECIAL_CHAR, FIELD_VALIDATION.MSG_KEY.SPECIAL_CHAR)
  .refine(FIELD_VALIDATION.TEST.LOWERCASE, FIELD_VALIDATION.MSG_KEY.LOWERCASE)
  .refine(FIELD_VALIDATION.TEST.UPPERCASE, FIELD_VALIDATION.MSG_KEY.UPPERCASE)
  .refine(FIELD_VALIDATION.TEST.NUMBER, FIELD_VALIDATION.MSG_KEY.NUMBER);
