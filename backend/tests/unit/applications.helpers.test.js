import { describe, it, expect } from 'vitest';
import {
  calculateMatchScore,
  pickAssignedRole,
  normalizeProjectRole
} from '../../src/services/applications.helpers.js';

describe('Applications Helpers', () => {
  
  describe('normalizeProjectRole', () => {
    it('should return a trimmed string when valid', () => {
      expect(normalizeProjectRole('  Frontend Developer  ')).toBe('Frontend Developer');
    });

    it('should return null if the value is not a string', () => {
      expect(normalizeProjectRole(123)).toBeNull();
      expect(normalizeProjectRole(undefined)).toBeNull();
      expect(normalizeProjectRole(null)).toBeNull();
    });

    it('should return null if the string is too short or too long', () => {
      expect(normalizeProjectRole('A')).toBeNull(); // < 2
      expect(normalizeProjectRole('A'.repeat(51))).toBeNull(); // > 50
    });
  });

  describe('calculateMatchScore', () => {
    it('should return 100 if all skills match', () => {
      const user = { skills: ['React', 'Node.js', 'MongoDB'] };
      const project = { requiredSkills: ['react', 'NODE.JS', 'mongodb'] };
      
      const score = calculateMatchScore(user, project);
      expect(score).toBe(100);
    });

    it('should calculate match percentage relative to project requirements', () => {
      const user = { skills: ['React', 'Docker', 'AWS'] }; // 3 skills
      const project = { requiredSkills: ['React', 'Node.js'] }; // 2 skills
      
      // Intersection = 1 ('React')
      // Denominator = projectSet.size = 2
      // Score = (1 / 2) * 100 = 50
      const score = calculateMatchScore(user, project);
      expect(score).toBe(50);
    });

    it('should calculate fractional match for users with fewer skills than required', () => {
      const user = { skills: ['React'] }; // 1 skill
      const project = { requiredSkills: ['React', 'Node.js', 'Docker'] }; // 3 skills
      
      // Intersection = 1 ('React')
      // Denominator = projectSet.size = 3
      // Score = Math.round((1 / 3) * 100) = 33
      const score = calculateMatchScore(user, project);
      expect(score).toBe(33);
    });

    it('should return 0 if there are no matching skills', () => {
      const user = { skills: ['Python', 'Django'] };
      const project = { requiredSkills: ['React', 'Node.js'] };
      
      const score = calculateMatchScore(user, project);
      expect(score).toBe(0);
    });

    it('should return 0 if arrays are missing', () => {
      expect(calculateMatchScore({}, { requiredSkills: ['React'] })).toBe(0);
      expect(calculateMatchScore({ skills: ['React'] }, {})).toBe(0);
    });
  });

  describe('pickAssignedRole', () => {
    it('should pick preferredRole if it matches an open role', () => {
      const project = { openRoles: ['Frontend Developer', 'Backend Developer'] };
      const result = pickAssignedRole({ preferredRole: 'frontend developer', project });
      
      expect(result).toBe('Frontend Developer');
      expect(project.openRoles).toEqual(['Backend Developer']);
    });

    it('should fallback to invitedRole if preferredRole is not provided', () => {
      const project = { openRoles: ['Frontend Developer', 'Backend Developer'] };
      const result = pickAssignedRole({ invitedRole: 'Backend Developer', project });
      
      expect(result).toBe('Backend Developer');
      expect(project.openRoles).toEqual(['Frontend Developer']);
    });

    it('should fallback to first open role if no role was provided at all', () => {
      const project = { openRoles: ['UI/UX Designer', 'Backend Developer'] };
      const result = pickAssignedRole({ project });
      
      // It pops the first open role
      expect(result).toBe('UI/UX Designer');
      expect(project.openRoles).toEqual(['Backend Developer']);
    });

    it('should return "Member" if there are no open roles and no requested roles', () => {
      const project = { openRoles: [] };
      const result = pickAssignedRole({ project });
      
      expect(result).toBe('Member');
    });
  });

});
