import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseDays, ensureProjectMemberOrOwner, startOfDayUtc, addDaysUtc } from '../../src/services/analytics.helpers.js';
import Project from '../../src/models/project.model.js';
import Team from '../../src/models/team.model.js';

// Mock mongoose models
vi.mock('../../src/models/project.model.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

vi.mock('../../src/models/team.model.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

describe('Analytics Helpers (Unit Tests)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseDays()', () => {
    it('should parse valid numbers within bounds (Normal Case)', () => {
      expect(parseDays('30', 7)).toBe(30);
      expect(parseDays(45, 7)).toBe(45);
    });

    it('should return fallback for non-finite values (Invalid Input)', () => {
      expect(parseDays('abc', 7)).toBe(7);
      expect(parseDays(NaN, 14)).toBe(14);
    });

    it('should clamp values to max 90 (Edge Case)', () => {
      expect(parseDays(100, 7)).toBe(90);
      expect(parseDays(999, 7)).toBe(90);
    });

    it('should clamp values to min 1 (Edge Case)', () => {
      expect(parseDays(0, 7)).toBe(1);
      expect(parseDays(-5, 7)).toBe(1);
    });
  });

  describe('ensureProjectMemberOrOwner()', () => {
    const mockProjectId = '12345';
    const mockRequesterId = '98765';

    it('should return project and isOwner=true if requester is the owner (Normal Case)', async () => {
      Project.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: mockProjectId, owner: mockRequesterId })
        })
      });

      const result = await ensureProjectMemberOrOwner({ projectId: mockProjectId, requesterId: mockRequesterId });
      
      expect(result.isOwner).toBe(true);
      expect(result.project._id).toBe(mockProjectId);
      expect(Project.findOne).toHaveBeenCalledTimes(1);
      expect(Team.findOne).not.toHaveBeenCalled();
    });

    it('should return project and isOwner=false if requester is a team member (Normal Case)', async () => {
      Project.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: mockProjectId, owner: 'someoneElse' })
        })
      });

      Team.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: 'teamMemberId' })
        })
      });

      const result = await ensureProjectMemberOrOwner({ projectId: mockProjectId, requesterId: mockRequesterId });
      
      expect(result.isOwner).toBe(false);
      expect(Team.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw "Project not found" if project does not exist (Error Handling)', async () => {
      Project.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null)
        })
      });

      await expect(ensureProjectMemberOrOwner({ projectId: mockProjectId, requesterId: mockRequesterId }))
        .rejects.toThrow('Project not found');
    });

    it('should throw "Not authorized" if user is neither owner nor team member (Authorization Failure)', async () => {
      Project.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: mockProjectId, owner: 'someoneElse' })
        })
      });

      Team.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null)
        })
      });

      await expect(ensureProjectMemberOrOwner({ projectId: mockProjectId, requesterId: mockRequesterId }))
        .rejects.toThrow('Not authorized');
    });
  });

  describe('Date Helpers', () => {
    it('startOfDayUtc should zero out hours/mins/secs/ms', () => {
      const d = new Date('2023-10-15T15:30:45.123Z');
      const start = startOfDayUtc(d);
      expect(start.toISOString()).toBe('2023-10-15T00:00:00.000Z');
    });

    it('addDaysUtc should add days correctly', () => {
      const d = new Date('2023-10-15T00:00:00.000Z');
      const future = addDaysUtc(d, 5);
      expect(future.toISOString()).toBe('2023-10-20T00:00:00.000Z');
    });
  });
});
