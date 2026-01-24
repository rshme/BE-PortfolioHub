import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ApiResponse, PaginatedResponse } from '../../common/interfaces/response.interface';
import { Project } from './entities/project.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'banner', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
    @UploadedFiles()
    files?: {
      banner?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ): Promise<ApiResponse<Project>> {
    const banner = files?.banner?.[0];
    const images = files?.images;

    const project = await this.projectsService.create(
      createProjectDto,
      user.id,
      banner,
      images,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Project created successfully',
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryDto: QueryProjectDto): Promise<PaginatedResponse<Project>> {
    const result = await this.projectsService.findAll(queryDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Projects retrieved successfully',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<Project>> {
    const project = await this.projectsService.findOne(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Project retrieved successfully',
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'banner', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
    @UploadedFiles()
    files?: {
      banner?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ): Promise<ApiResponse<Project>> {
    const banner = files?.banner?.[0];
    const images = files?.images;

    const project = await this.projectsService.update(
      id,
      updateProjectDto,
      user.id,
      user.role,
      banner,
      images,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Project updated successfully',
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<void>> {
    await this.projectsService.remove(id, user.id, user.role);

    return {
      statusCode: HttpStatus.OK,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
