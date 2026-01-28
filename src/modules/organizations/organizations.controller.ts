import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '../../common/interfaces/api-response.interface';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * Create a new organization (Admin only)
   * POST /organizations
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<ApiResponse<OrganizationResponseDto>> {
    const organization = await this.organizationsService.create(
      createOrganizationDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Organization created successfully',
      data: plainToInstance(OrganizationResponseDto, organization),
    };
  }

  /**
   * Get all organizations with pagination
   * GET /organizations?page=1&limit=10&isActive=true
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
  ): Promise<ApiResponse<OrganizationResponseDto[]>> {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;

    const result = await this.organizationsService.findAll(
      page,
      limit,
      isActiveBoolean,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Organizations retrieved successfully',
      data: plainToInstance(OrganizationResponseDto, result.data),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get organization by ID
   * GET /organizations/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<OrganizationResponseDto>> {
    const organization = await this.organizationsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Organization retrieved successfully',
      data: plainToInstance(OrganizationResponseDto, organization),
    };
  }

  /**
   * Update organization (Admin only)
   * PUT /organizations/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<ApiResponse<OrganizationResponseDto>> {
    const organization = await this.organizationsService.update(
      id,
      updateOrganizationDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Organization updated successfully',
      data: plainToInstance(OrganizationResponseDto, organization),
    };
  }

  /**
   * Soft delete organization (Admin only)
   * DELETE /organizations/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.organizationsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Organization deleted successfully',
      data: null,
    };
  }

  /**
   * Hard delete organization (Admin only)
   * DELETE /organizations/:id/hard
   */
  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async hardRemove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.organizationsService.hardRemove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Organization permanently deleted',
      data: null,
    };
  }
}
