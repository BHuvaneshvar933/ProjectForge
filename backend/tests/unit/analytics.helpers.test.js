import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseDays, ensureProjectMemberOrOwner, startOfDayUtc, addDaysUtc } from '../../src/services/analytics.helpers.js';
import Project from '../../src/models/project.model.js';
import Team from '../../src/models/team.model.js';

// mock db
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

describe('analytics helpers', () => {

  beforeEach(() => {
    vi.clearAllMocks(); // reset mocks
  });

  describe('parsedays', () => {
    it('parses ok numbers', () => {
      expect(parseDays('30', 7)).toBe(30);
      expect(parseDays(45, 7)).toBe(45);
    });

    it('falls back on bad input', () => {
      expect(parseDays('abc', 7)).toBe(7);
      expect(parseDays(NaN, 14)).toBe(14);
    });

    it('caps at 90', () => {
      expect(parseDays(100, 7)).toBe(90);
      expect(parseDays(999, 7)).toBe(90);
    });

    it('bottoms at 1', () => {
      expect(parseDays(0, 7)).toBe(1);
      expect(parseDays(-5, 7)).toBe(1);
    });
  });

  describe('check project membership', () => {
    const mockProjectId = '12345';
    const mockRequesterId = '98765';

    it('works if owner', async () => {
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

    it('works if team member', async () => {
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

    it('throws if missing project', async () => {
      Project.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null)
        })
      });

      await expect(ensureProjectMemberOrOwner({ projectId: mockProjectId, requesterId: mockRequesterId }))
        .rejects.toThrow('Project not found');
    });

    it('throws if not auth', async () => {
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

  describe('dates', () => {
    it('startofday clears time', () => {
      const d = new Date('2023-10-15T15:30:45.123Z');
      const start = startOfDayUtc(d);
      expect(start.toISOString()).toBe('2023-10-15T00:00:00.000Z');
    });

    it('adddays adds days', () => {
      const d = new Date('2023-10-15T00:00:00.000Z');
      const future = addDaysUtc(d, 5);
      expect(future.toISOString()).toBe('2023-10-20T00:00:00.000Z');
    });
  });
});
