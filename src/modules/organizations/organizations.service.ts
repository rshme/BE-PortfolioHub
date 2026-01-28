import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  /**
   * Create a new organization
   */
  async create(
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    // Check if organization name already exists
    const existingOrg = await this.organizationsRepository.findOne({
      where: { name: createOrganizationDto.name },
    });

    if (existingOrg) {
      throw new ConflictException('Organization name already exists');
    }

    const organization = this.organizationsRepository.create(
      createOrganizationDto,
    );
    return await this.organizationsRepository.save(organization);
  }

  /**
   * Find all organizations with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<{
    data: Organization[];
    total: number;
    page: number;
    limit: number;
  }> {
    const whereCondition = isActive !== undefined ? { isActive } : {};

    const [data, total] = await this.organizationsRepository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find organization by ID
   */
  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Update organization
   */
  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findOne(id);

    // Check if new name conflicts with existing organizations
    if (
      updateOrganizationDto.name &&
      updateOrganizationDto.name !== organization.name
    ) {
      const existingOrg = await this.organizationsRepository.findOne({
        where: { name: updateOrganizationDto.name },
      });

      if (existingOrg) {
        throw new ConflictException('Organization name already exists');
      }
    }

    Object.assign(organization, updateOrganizationDto);
    return await this.organizationsRepository.save(organization);
  }

  /**
   * Delete organization (soft delete by setting isActive to false)
   */
  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);
    organization.isActive = false;
    await this.organizationsRepository.save(organization);
  }

  /**
   * Hard delete organization
   */
  async hardRemove(id: string): Promise<void> {
    const organization = await this.findOne(id);
    await this.organizationsRepository.remove(organization);
  }
}
