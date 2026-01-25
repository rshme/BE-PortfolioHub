import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { ProjectMentor } from './entities/project-mentor.entity';
import { ProjectVolunteer } from './entities/project-volunteer.entity';
import { CloudinaryService } from '../../config/cloudinary.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';

describe('ProjectsService - Mentor & Volunteer Operations', () => {
  let service: ProjectsService;
  let projectRepository: Repository<Project>;
  let mentorRepository: Repository<ProjectMentor>;
  let volunteerRepository: Repository<ProjectVolunteer>;

  const mockProject = {
    id: 'project-123',
    creatorId: 'creator-123',
    name: 'Test Project',
    volunteers: [],
  };

  const mockMentor = {
    id: 'mentor-123',
    projectId: 'project-123',
    userId: 'user-123',
    status: MentorStatus.PENDING,
    expertiseAreas: ['Backend'],
    applicationMessage: 'I want to mentor',
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockVolunteer = {
    id: 'volunteer-123',
    projectId: 'project-123',
    userId: 'user-123',
    status: VolunteerStatus.PENDING,
    applicationMessage: 'I want to help',
    contributionScore: 0,
    tasksCompleted: 0,
    joinedAt: new Date(),
    leftAt: null,
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };

  const mockMentorRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockVolunteerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(ProjectCategory),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProjectSkill),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProjectMentor),
          useValue: mockMentorRepository,
        },
        {
          provide: getRepositoryToken(ProjectVolunteer),
          useValue: mockVolunteerRepository,
        },
        {
          provide: CloudinaryService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepository = module.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    mentorRepository = module.get<Repository<ProjectMentor>>(
      getRepositoryToken(ProjectMentor),
    );
    volunteerRepository = module.get<Repository<ProjectVolunteer>>(
      getRepositoryToken(ProjectVolunteer),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mentor Operations', () => {
    describe('applyAsMentor', () => {
      it('should apply as mentor successfully', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue(null);
        mockMentorRepository.create.mockReturnValue(mockMentor);
        mockMentorRepository.save.mockResolvedValue(mockMentor);

        const result = await service.applyAsMentor(
          'project-123',
          'user-123',
          'I want to mentor',
          ['Backend'],
        );

        expect(result).toEqual(mockMentor);
        expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'project-123' },
        });
        expect(mockMentorRepository.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException if project not found', async () => {
        mockProjectRepository.findOne.mockResolvedValue(null);

        await expect(
          service.applyAsMentor('project-123', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if user is project creator', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
          ...mockProject,
          creatorId: 'user-123',
        });

        await expect(
          service.applyAsMentor('project-123', 'user-123'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw ConflictException if user already applied', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.PENDING,
        });

        await expect(
          service.applyAsMentor('project-123', 'user-123'),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('acceptMentorInvitation', () => {
      it('should accept mentor invitation successfully', async () => {
        const invitation = {
          ...mockMentor,
          invitedBy: 'creator-123',
          status: MentorStatus.PENDING,
        };
        mockMentorRepository.findOne.mockResolvedValue(invitation);
        mockMentorRepository.save.mockResolvedValue({
          ...invitation,
          status: MentorStatus.ACTIVE,
        });

        const result = await service.acceptMentorInvitation(
          'project-123',
          'user-123',
        );

        expect(result.status).toBe(MentorStatus.ACTIVE);
        expect(mockMentorRepository.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException if invitation not found', async () => {
        mockMentorRepository.findOne.mockResolvedValue(null);

        await expect(
          service.acceptMentorInvitation('project-123', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if not an invitation', async () => {
        mockMentorRepository.findOne.mockResolvedValue({
          ...mockMentor,
          invitedBy: null,
        });

        await expect(
          service.acceptMentorInvitation('project-123', 'user-123'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('inviteMentor', () => {
      it('should invite mentor successfully by creator', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue(null);
        mockMentorRepository.create.mockReturnValue({
          ...mockMentor,
          invitedBy: 'creator-123',
        });
        mockMentorRepository.save.mockResolvedValue({
          ...mockMentor,
          invitedBy: 'creator-123',
        });

        const result = await service.inviteMentor(
          'project-123',
          'user-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(result.invitedBy).toBe('creator-123');
        expect(mockMentorRepository.save).toHaveBeenCalled();
      });

      it('should throw ForbiddenException if not authorized', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        await expect(
          service.inviteMentor(
            'project-123',
            'user-123',
            'other-user',
            UserRole.PROJECT_OWNER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if inviting project creator', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        await expect(
          service.inviteMentor(
            'project-123',
            'creator-123',
            'creator-123',
            UserRole.PROJECT_OWNER,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw ConflictException if user already invited', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.PENDING,
        });

        await expect(
          service.inviteMentor(
            'project-123',
            'user-123',
            'creator-123',
            UserRole.PROJECT_OWNER,
          ),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('approveMentor', () => {
      it('should approve mentor successfully', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue(mockMentor);
        mockMentorRepository.save.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.ACTIVE,
        });

        const result = await service.approveMentor(
          'project-123',
          'mentor-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(result.status).toBe(MentorStatus.ACTIVE);
      });

      it('should throw ForbiddenException if not authorized', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        await expect(
          service.approveMentor(
            'project-123',
            'mentor-123',
            'other-user',
            UserRole.VOLUNTEER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if status not pending', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.ACTIVE,
        });

        await expect(
          service.approveMentor(
            'project-123',
            'mentor-123',
            'creator-123',
            UserRole.PROJECT_OWNER,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('rejectMentor', () => {
      it('should reject mentor successfully', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockMentorRepository.findOne.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.PENDING,
        });
        mockMentorRepository.save.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.REJECTED,
        });

        const result = await service.rejectMentor(
          'project-123',
          'mentor-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(result.status).toBe(MentorStatus.REJECTED);
      });
    });

    describe('leaveMentor', () => {
      it('should leave as mentor successfully', async () => {
        mockMentorRepository.findOne.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.ACTIVE,
        });
        mockMentorRepository.save.mockResolvedValue({
          ...mockMentor,
          status: MentorStatus.LEFT,
          leftAt: new Date(),
        });

        const result = await service.leaveMentor('project-123', 'user-123');

        expect(result.status).toBe(MentorStatus.LEFT);
        expect(result.leftAt).toBeDefined();
      });

      it('should throw NotFoundException if not active mentor', async () => {
        mockMentorRepository.findOne.mockResolvedValue(null);

        await expect(
          service.leaveMentor('project-123', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getProjectMentors', () => {
      it('should get all project mentors', async () => {
        const mentors = [mockMentor, { ...mockMentor, id: 'mentor-456' }];
        mockMentorRepository.find.mockResolvedValue(mentors);

        const result = await service.getProjectMentors('project-123');

        expect(result).toEqual(mentors);
        expect(result).toHaveLength(2);
        expect(mockMentorRepository.find).toHaveBeenCalledWith({
          where: { projectId: 'project-123' },
          relations: ['user', 'inviter'],
          order: { joinedAt: 'DESC' },
        });
      });

      it('should get project mentors filtered by status', async () => {
        const pendingMentors = [mockMentor];
        mockMentorRepository.find.mockResolvedValue(pendingMentors);

        const result = await service.getProjectMentors(
          'project-123',
          MentorStatus.PENDING,
        );

        expect(result).toEqual(pendingMentors);
        expect(result).toHaveLength(1);
        expect(mockMentorRepository.find).toHaveBeenCalledWith({
          where: { projectId: 'project-123', status: MentorStatus.PENDING },
          relations: ['user', 'inviter'],
          order: { joinedAt: 'DESC' },
        });
      });
    });

    describe('getPendingMentors', () => {
      it('should get pending mentor applications', async () => {
        const pendingMentors = [mockMentor];
        mockMentorRepository.find.mockResolvedValue(pendingMentors);

        const result = await service.getPendingMentors('project-123');

        expect(result).toEqual(pendingMentors);
        expect(result).toHaveLength(1);
        expect(mockMentorRepository.find).toHaveBeenCalledWith({
          where: { projectId: 'project-123', status: MentorStatus.PENDING },
          relations: ['user', 'inviter'],
          order: { joinedAt: 'DESC' },
        });
      });
    });
  });

  describe('Volunteer Operations', () => {
    describe('applyAsVolunteer', () => {
      it('should apply as volunteer successfully', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue(null);
        mockVolunteerRepository.create.mockReturnValue(mockVolunteer);
        mockVolunteerRepository.save.mockResolvedValue(mockVolunteer);

        const result = await service.applyAsVolunteer(
          'project-123',
          'user-123',
          'I want to help',
        );

        expect(result).toEqual(mockVolunteer);
        expect(mockVolunteerRepository.save).toHaveBeenCalled();
      });

      it('should throw NotFoundException if project not found', async () => {
        mockProjectRepository.findOne.mockResolvedValue(null);

        await expect(
          service.applyAsVolunteer('project-123', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if user is project creator', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
          ...mockProject,
          creatorId: 'user-123',
        });

        await expect(
          service.applyAsVolunteer('project-123', 'user-123'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw ConflictException if user already applied', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.PENDING,
        });

        await expect(
          service.applyAsVolunteer('project-123', 'user-123'),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('acceptVolunteerInvitation', () => {
      it('should accept volunteer invitation and update count', async () => {
        const invitation = {
          ...mockVolunteer,
          invitedBy: 'creator-123',
          status: VolunteerStatus.PENDING,
        };
        mockVolunteerRepository.findOne.mockResolvedValue(invitation);
        mockVolunteerRepository.save.mockResolvedValue({
          ...invitation,
          status: VolunteerStatus.ACTIVE,
        });
        mockVolunteerRepository.count.mockResolvedValue(1);
        mockProjectRepository.update.mockResolvedValue({});

        const result = await service.acceptVolunteerInvitation(
          'project-123',
          'user-123',
        );

        expect(result.status).toBe(VolunteerStatus.ACTIVE);
        expect(mockProjectRepository.update).toHaveBeenCalledWith(
          'project-123',
          {
            volunteerCount: 1,
          },
        );
      });

      it('should throw NotFoundException if invitation not found', async () => {
        mockVolunteerRepository.findOne.mockResolvedValue(null);

        await expect(
          service.acceptVolunteerInvitation('project-123', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if not an invitation', async () => {
        mockVolunteerRepository.findOne.mockResolvedValue({
          ...mockVolunteer,
          invitedBy: null,
        });

        await expect(
          service.acceptVolunteerInvitation('project-123', 'user-123'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('inviteVolunteer', () => {
      it('should invite volunteer successfully by creator', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue(null);
        mockVolunteerRepository.create.mockReturnValue({
          ...mockVolunteer,
          invitedBy: 'creator-123',
        });
        mockVolunteerRepository.save.mockResolvedValue({
          ...mockVolunteer,
          invitedBy: 'creator-123',
        });

        const result = await service.inviteVolunteer(
          'project-123',
          'user-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(result.invitedBy).toBe('creator-123');
      });

      it('should throw ForbiddenException if not authorized', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        await expect(
          service.inviteVolunteer(
            'project-123',
            'user-123',
            'other-user',
            UserRole.VOLUNTEER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('approveVolunteer', () => {
      it('should approve volunteer and update count', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue(mockVolunteer);
        mockVolunteerRepository.save.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.ACTIVE,
        });
        mockVolunteerRepository.count.mockResolvedValue(1);
        mockProjectRepository.update.mockResolvedValue({});

        const result = await service.approveVolunteer(
          'project-123',
          'volunteer-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(result.status).toBe(VolunteerStatus.ACTIVE);
        expect(mockProjectRepository.update).toHaveBeenCalled();
      });

      it('should throw ForbiddenException if not authorized', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        await expect(
          service.approveVolunteer(
            'project-123',
            'volunteer-123',
            'other-user',
            UserRole.VOLUNTEER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if status not pending', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.ACTIVE,
        });

        await expect(
          service.approveVolunteer(
            'project-123',
            'volunteer-123',
            'creator-123',
            UserRole.PROJECT_OWNER,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('rejectVolunteer', () => {
      it('should reject volunteer successfully', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.PENDING,
        });
        mockVolunteerRepository.save.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.REJECTED,
        });

        const result = await service.rejectVolunteer(
          'project-123',
          'volunteer-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(result.status).toBe(VolunteerStatus.REJECTED);
      });
    });

    describe('removeVolunteer', () => {
      it('should remove volunteer and update count', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);
        mockVolunteerRepository.findOne.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.ACTIVE,
        });
        mockVolunteerRepository.save.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.LEFT,
          leftAt: new Date(),
        });
        mockVolunteerRepository.count.mockResolvedValue(0);
        mockProjectRepository.update.mockResolvedValue({});

        await service.removeVolunteer(
          'project-123',
          'volunteer-123',
          'creator-123',
          UserRole.PROJECT_OWNER,
        );

        expect(mockVolunteerRepository.save).toHaveBeenCalled();
        expect(mockProjectRepository.update).toHaveBeenCalledWith(
          'project-123',
          {
            volunteerCount: 0,
          },
        );
      });

      it('should throw ForbiddenException if not authorized', async () => {
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        await expect(
          service.removeVolunteer(
            'project-123',
            'volunteer-123',
            'other-user',
            UserRole.VOLUNTEER,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('leaveVolunteer', () => {
      it('should leave as volunteer and update count', async () => {
        mockVolunteerRepository.findOne.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.ACTIVE,
        });
        mockVolunteerRepository.save.mockResolvedValue({
          ...mockVolunteer,
          status: VolunteerStatus.LEFT,
          leftAt: new Date(),
        });
        mockVolunteerRepository.count.mockResolvedValue(0);
        mockProjectRepository.update.mockResolvedValue({});

        const result = await service.leaveVolunteer('project-123', 'user-123');

        expect(result.status).toBe(VolunteerStatus.LEFT);
        expect(result.leftAt).toBeDefined();
        expect(mockProjectRepository.update).toHaveBeenCalled();
      });

      it('should throw NotFoundException if not active volunteer', async () => {
        mockVolunteerRepository.findOne.mockResolvedValue(null);

        await expect(
          service.leaveVolunteer('project-123', 'user-123'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getProjectVolunteers', () => {
      it('should get all project volunteers', async () => {
        const volunteers = [
          mockVolunteer,
          { ...mockVolunteer, id: 'volunteer-456' },
        ];
        mockVolunteerRepository.find.mockResolvedValue(volunteers);

        const result = await service.getProjectVolunteers('project-123');

        expect(result).toEqual(volunteers);
        expect(result).toHaveLength(2);
        expect(mockVolunteerRepository.find).toHaveBeenCalledWith({
          where: { projectId: 'project-123' },
          relations: ['user', 'inviter'],
          order: { joinedAt: 'DESC' },
        });
      });

      it('should get project volunteers filtered by status', async () => {
        const pendingVolunteers = [mockVolunteer];
        mockVolunteerRepository.find.mockResolvedValue(pendingVolunteers);

        const result = await service.getProjectVolunteers(
          'project-123',
          VolunteerStatus.PENDING,
        );

        expect(result).toEqual(pendingVolunteers);
        expect(result).toHaveLength(1);
        expect(mockVolunteerRepository.find).toHaveBeenCalledWith({
          where: { projectId: 'project-123', status: VolunteerStatus.PENDING },
          relations: ['user', 'inviter'],
          order: { joinedAt: 'DESC' },
        });
      });
    });

    describe('getPendingVolunteers', () => {
      it('should get pending volunteer applications', async () => {
        const pendingVolunteers = [mockVolunteer];
        mockVolunteerRepository.find.mockResolvedValue(pendingVolunteers);

        const result = await service.getPendingVolunteers('project-123');

        expect(result).toEqual(pendingVolunteers);
        expect(result).toHaveLength(1);
        expect(mockVolunteerRepository.find).toHaveBeenCalledWith({
          where: { projectId: 'project-123', status: VolunteerStatus.PENDING },
          relations: ['user', 'inviter'],
          order: { joinedAt: 'DESC' },
        });
      });
    });
  });
});
