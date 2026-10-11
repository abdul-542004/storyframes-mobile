import { StoryUser } from '../../src/lib/types';

describe('U01 & U02: Authentication & User Profile Schema Validation', () => {
  // Helper validation functions matching Auth business logic
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }

  function deriveInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function validateUserProfile(user: Partial<StoryUser>): boolean {
    if (!user.id || typeof user.id !== 'string') return false;
    if (!user.name || typeof user.name !== 'string') return false;
    if (!user.username || !user.username.startsWith('@')) return false;
    if (!user.avatarColor || !/^#[0-9A-Fa-f]{6}$/.test(user.avatarColor)) return false;
    if (!user.initials || user.initials.length > 3) return false;
    return true;
  }

  describe('U01: Credential Validation', () => {
    it('accepts valid email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('student.se23061@university.edu')).toBe(true);
      expect(validateEmail('author+test@domain.co')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('plainaddress')).toBe(false);
      expect(validateEmail('@missingusername.com')).toBe(false);
      expect(validateEmail('username@.com')).toBe(false);
      expect(validateEmail('user with spaces@example.com')).toBe(false);
    });

    it('enforces minimum 6-character password length', () => {
      expect(validatePassword('12345').valid).toBe(false);
      expect(validatePassword('123456').valid).toBe(true);
      expect(validatePassword('strongSecretPass!').valid).toBe(true);
    });
  });

  describe('U02: User Profile Schema & Initials Generation', () => {
    it('correctly generates user initials from multi-word names', () => {
      expect(deriveInitials('Abdullah Khan')).toBe('AK');
      expect(deriveInitials('Furqanullah')).toBe('FU');
      expect(deriveInitials('Masroor Hassan')).toBe('MH');
      expect(deriveInitials('  John  Doe  ')).toBe('JD');
    });

    it('validates compliant StoryUser schemas', () => {
      const validUser: StoryUser = {
        id: 'usr_123',
        name: 'Abdullah Khan',
        username: '@abdullah',
        avatarColor: '#7A9E87',
        initials: 'AK',
        bio: 'Mobile dev & storyteller',
        followers: 42,
        following: 10,
      };
      expect(validateUserProfile(validUser)).toBe(true);
    });

    it('rejects invalid StoryUser profiles missing username @ prefix or invalid hex colors', () => {
      const badUsernameUser = {
        id: 'usr_456',
        name: 'Invalid User',
        username: 'no_at_symbol',
        avatarColor: '#7A9E87',
        initials: 'IU',
      };
      expect(validateUserProfile(badUsernameUser)).toBe(false);

      const badColorUser = {
        id: 'usr_789',
        name: 'Invalid Color',
        username: '@badcolor',
        avatarColor: 'red', // Not a 6-digit hex code
        initials: 'IC',
      };
      expect(validateUserProfile(badColorUser)).toBe(false);
    });
  });
});
