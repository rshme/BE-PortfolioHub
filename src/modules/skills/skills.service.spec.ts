import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './dto';

describe('SkillsService', () => {
  let service: SkillsService;
  let repository: Repository<Skill>;

  const mockSkill: Skill = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'JavaScript',
    icon: 'js-icon',
    createdAt: new Date(),
    userSkills: [],
    projectSkills: [],
  };

  const mockSkillRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(Skill),
          useValue: mockSkillRepository,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    repository = module.get<Repository<Skill>>(getRepositoryToken(Skill));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSkillDto: CreateSkillDto = {
      name: 'JavaScript',
      icon: 'js-icon',
    };

    it('should create a new skill', async () => {
      mockSkillRepository.findOne.mockResolvedValue(null);
      mockSkillRepository.create.mockReturnValue(mockSkill);
      mockSkillRepository.save.mockResolvedValue(mockSkill);

      const result = await service.create(createSkillDto);

      expect(mockSkillRepository.findOne).toHaveBeenCalledWith({
        where: { name: createSkillDto.name },
      });
      expect(mockSkillRepository.create).toHaveBeenCalledWith(createSkillDto);
      expect(mockSkillRepository.save).toHaveBeenCalledWith(mockSkill);
      expect(result).toEqual(mockSkill);
    });

    it('should throw ConflictException if skill name already exists', async () => {
      mockSkillRepository.findOne.mockResolvedValue(mockSkill);

      await expect(service.create(createSkillDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createSkillDto)).rejects.toThrow(
        `Skill with name "${createSkillDto.name}" already exists`,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of skills', async () => {
      const skills = [mockSkill];
      mockSkillRepository.find.mockResolvedValue(skills);

      const result = await service.findAll();

      expect(mockSkillRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual(skills);
    });

    it('should return an empty array if no skills exist', async () => {
      mockSkillRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a skill by id', async () => {
      mockSkillRepository.findOne.mockResolvedValue(mockSkill);

      const result = await service.findOne(mockSkill.id);

      expect(mockSkillRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSkill.id },
      });
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException if skill not found', async () => {
      const id = 'non-existent-id';
      mockSkillRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(
        `Skill with ID "${id}" not found`,
      );
    });
  });

  describe('update', () => {
    const updateSkillDto: UpdateSkillDto = {
      name: 'TypeScript',
      icon: 'ts-icon',
    };

    it('should update a skill', async () => {
      const updatedSkill = { ...mockSkill, ...updateSkillDto };
      mockSkillRepository.findOne.mockResolvedValueOnce(mockSkill);
      mockSkillRepository.findOne.mockResolvedValueOnce(null);
      mockSkillRepository.save.mockResolvedValue(updatedSkill);

      const result = await service.update(mockSkill.id, updateSkillDto);

      expect(mockSkillRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateSkillDto.name);
      expect(result.icon).toBe(updateSkillDto.icon);
    });

    it('should throw NotFoundException if skill not found', async () => {
      const id = 'non-existent-id';
      mockSkillRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, updateSkillDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name already exists', async () => {
      const existingSkill = { ...mockSkill, id: 'different-id' };
      mockSkillRepository.findOne.mockResolvedValueOnce(mockSkill);
      mockSkillRepository.findOne.mockResolvedValueOnce(existingSkill);

      await expect(service.update(mockSkill.id, updateSkillDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a skill', async () => {
      mockSkillRepository.findOne.mockResolvedValue(mockSkill);
      mockSkillRepository.remove.mockResolvedValue(mockSkill);

      await service.remove(mockSkill.id);

      expect(mockSkillRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSkill.id },
      });
      expect(mockSkillRepository.remove).toHaveBeenCalledWith(mockSkill);
    });

    it('should throw NotFoundException if skill not found', async () => {
      const id = 'non-existent-id';
      mockSkillRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});
