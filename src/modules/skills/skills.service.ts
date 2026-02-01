import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    // Check if skill with same name exists
    const existingSkill = await this.skillRepository.findOne({
      where: { name: createSkillDto.name },
    });

    if (existingSkill) {
      throw new ConflictException(
        `Skill with name "${createSkillDto.name}" already exists`,
      );
    }

    const skill = this.skillRepository.create(createSkillDto);
    return await this.skillRepository.save(skill);
  }

  async findAll(): Promise<Skill[]> {
    return await this.skillRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }

    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findOne(id);

    // Check if new name already exists (for a different skill)
    if (updateSkillDto.name && updateSkillDto.name !== skill.name) {
      const existingSkill = await this.skillRepository.findOne({
        where: { name: updateSkillDto.name },
      });

      if (existingSkill) {
        throw new ConflictException(
          `Skill with name "${updateSkillDto.name}" already exists`,
        );
      }
    }

    Object.assign(skill, updateSkillDto);
    return await this.skillRepository.save(skill);
  }

  async remove(id: string): Promise<void> {
    const skill = await this.findOne(id);
    await this.skillRepository.remove(skill);
  }
}
