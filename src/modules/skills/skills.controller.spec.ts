import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto';
import { Skill } from './entities/skill.entity';

describe('SkillsController', () => {
  let controller: SkillsController;
  let service: SkillsService;

  const mockSkill: Skill = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'JavaScript',
    icon: 'js-icon',
    createdAt: new Date(),
    userSkills: [],
    projectSkills: [],
  };

  const mockSkillsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        {
          provide: SkillsService,
          useValue: mockSkillsService,
        },
      ],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
    service = module.get<SkillsService>(SkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createSkillDto: CreateSkillDto = {
      name: 'JavaScript',
      icon: 'js-icon',
    };

    it('should create a new skill', async () => {
      mockSkillsService.create.mockResolvedValue(mockSkill);

      const result = await controller.create(createSkillDto);

      expect(service.create).toHaveBeenCalledWith(createSkillDto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Skill created successfully',
        data: mockSkill,
        timestamp: expect.any(String),
      });
    });
  });

  describe('findAll', () => {
    it('should return all skills', async () => {
      const skills = [mockSkill];
      mockSkillsService.findAll.mockResolvedValue(skills);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Skills retrieved successfully',
        data: skills,
        timestamp: expect.any(String),
      });
    });
  });

  describe('findOne', () => {
    it('should return a skill by id', async () => {
      mockSkillsService.findOne.mockResolvedValue(mockSkill);

      const result = await controller.findOne(mockSkill.id);

      expect(service.findOne).toHaveBeenCalledWith(mockSkill.id);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Skill retrieved successfully',
        data: mockSkill,
        timestamp: expect.any(String),
      });
    });
  });

  describe('update', () => {
    const updateSkillDto: UpdateSkillDto = {
      name: 'TypeScript',
      icon: 'ts-icon',
    };

    it('should update a skill', async () => {
      const updatedSkill = { ...mockSkill, ...updateSkillDto };
      mockSkillsService.update.mockResolvedValue(updatedSkill);

      const result = await controller.update(mockSkill.id, updateSkillDto);

      expect(service.update).toHaveBeenCalledWith(mockSkill.id, updateSkillDto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Skill updated successfully',
        data: updatedSkill,
        timestamp: expect.any(String),
      });
    });
  });

  describe('remove', () => {
    it('should delete a skill', async () => {
      mockSkillsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockSkill.id);

      expect(service.remove).toHaveBeenCalledWith(mockSkill.id);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Skill deleted successfully',
        data: null,
        timestamp: expect.any(String),
      });
    });
  });
});
