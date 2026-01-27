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
import { SimilarityService } from './similarity.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  QueryProjectDto,
  VerifyProjectDto,
  ApplyMentorDto,
  InviteMentorDto,
  UpdateMentorStatusDto,
  ApplyVolunteerDto,
  InviteVolunteerDto,
  UpdateVolunteerStatusDto,
  QueryMentorDto,
  QueryVolunteerDto,
} from './dto';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/response.interface';
import { Project } from './entities/project.entity';
import { ProjectMentor } from './entities/project-mentor.entity';
import { ProjectVolunteer } from './entities/project-volunteer.entity';
import { ProjectRecommendation } from './interfaces/similarity.interface';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly similarityService: SimilarityService,
  ) {}

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
  async findAll(
    @Query() queryDto: QueryProjectDto,
  ): Promise<PaginatedResponse<Project>> {
    const result = await this.projectsService.findAll(queryDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Projects retrieved successfully',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('creator/:creatorId')
  @HttpCode(HttpStatus.OK)
  async findByCreatorId(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ): Promise<ApiResponse<Project[]>> {
    const projects = await this.projectsService.findByCreatorId(creatorId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Projects by creator retrieved successfully',
      data: projects,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('recommendations/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getRecommendations(
    @CurrentUser() user: User,
    @Query() queryDto: GetRecommendationsDto,
  ): Promise<ApiResponse<ProjectRecommendation[]>> {
    const recommendations = await this.similarityService.getRecommendations(
      user.id,
      queryDto.limit,
      queryDto.minSimilarity,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Project recommendations retrieved successfully',
      data: recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/statistics')
  @HttpCode(HttpStatus.OK)
  async getProjectStatistics(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<any>> {
    const statistics = await this.projectsService.getProjectStatistics(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Project statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ): Promise<ApiResponse<Project>> {
    const project = await this.projectsService.findOne(id, user?.id);

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

  @Patch(':id/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verifyProjectDto: VerifyProjectDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<Project>> {
    const project = await this.projectsService.verifyProject(
      id,
      user.id,
      verifyProjectDto.isVerified ?? true,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Project ${verifyProjectDto.isVerified !== false ? 'verified' : 'unverified'} successfully`,
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== MENTOR ENDPOINTS ====================

  @Post(':id/mentors/apply')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR)
  async applyAsMentor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() applyMentorDto: ApplyMentorDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor>> {
    const mentor = await this.projectsService.applyAsMentor(
      id,
      user.id,
      applyMentorDto.applicationMessage,
      applyMentorDto.expertiseAreas,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Mentor application submitted successfully',
      data: mentor,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/mentors/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async acceptMentorInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor>> {
    const mentor = await this.projectsService.acceptMentorInvitation(
      id,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Mentor invitation accepted successfully',
      data: mentor,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/mentors/invite')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async inviteMentor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() inviteMentorDto: InviteMentorDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor>> {
    const mentor = await this.projectsService.inviteMentor(
      id,
      inviteMentorDto.userId,
      user.id,
      user.role,
      inviteMentorDto.expertiseAreas,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Mentor invited successfully',
      data: mentor,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/mentors/:mentorId/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async approveMentor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mentorId', ParseUUIDPipe) mentorId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor>> {
    const mentor = await this.projectsService.approveMentor(
      id,
      mentorId,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Mentor approved successfully',
      data: mentor,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/mentors/:mentorId/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async rejectMentor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mentorId', ParseUUIDPipe) mentorId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor>> {
    const mentor = await this.projectsService.rejectMentor(
      id,
      mentorId,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Mentor application rejected',
      data: mentor,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/mentors/leave')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async leaveMentor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor>> {
    const mentor = await this.projectsService.leaveMentor(id, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully left as mentor',
      data: mentor,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/mentors')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getProjectMentors(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: QueryMentorDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor[]>> {
    const mentors = await this.projectsService.getProjectMentors(
      id,
      user.id,
      user.role,
      queryDto.status,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Mentors retrieved successfully',
      data: mentors,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/mentors/pending')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getPendingMentors(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectMentor[]>> {
    const mentors = await this.projectsService.getPendingMentors(
      id,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Pending mentor applications retrieved successfully',
      data: mentors,
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== VOLUNTEER ENDPOINTS ====================

  @Post(':id/volunteers/apply')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VOLUNTEER)
  async applyAsVolunteer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() applyVolunteerDto: ApplyVolunteerDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer>> {
    const volunteer = await this.projectsService.applyAsVolunteer(
      id,
      user.id,
      applyVolunteerDto.applicationMessage,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Volunteer application submitted successfully',
      data: volunteer,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/volunteers/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async acceptVolunteerInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer>> {
    const volunteer = await this.projectsService.acceptVolunteerInvitation(
      id,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Volunteer invitation accepted successfully',
      data: volunteer,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/volunteers/invite')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async inviteVolunteer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() inviteVolunteerDto: InviteVolunteerDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer>> {
    const volunteer = await this.projectsService.inviteVolunteer(
      id,
      inviteVolunteerDto.userId,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Volunteer invited successfully',
      data: volunteer,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/volunteers/:volunteerId/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async approveVolunteer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer>> {
    const volunteer = await this.projectsService.approveVolunteer(
      id,
      volunteerId,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Volunteer approved successfully',
      data: volunteer,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/volunteers/:volunteerId/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async rejectVolunteer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer>> {
    const volunteer = await this.projectsService.rejectVolunteer(
      id,
      volunteerId,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Volunteer application rejected',
      data: volunteer,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/volunteers/:volunteerId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async removeVolunteer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('volunteerId', ParseUUIDPipe) volunteerId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<void>> {
    await this.projectsService.removeVolunteer(
      id,
      volunteerId,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Volunteer removed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/volunteers/leave')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async leaveVolunteer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer>> {
    const volunteer = await this.projectsService.leaveVolunteer(id, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully left as volunteer',
      data: volunteer,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/volunteers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getProjectVolunteers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: QueryVolunteerDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer[]>> {
    const volunteers = await this.projectsService.getProjectVolunteers(
      id,
      user.id,
      user.role,
      queryDto.status,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Volunteers retrieved successfully',
      data: volunteers,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/volunteers/pending')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getPendingVolunteers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<ProjectVolunteer[]>> {
    const volunteers = await this.projectsService.getPendingVolunteers(
      id,
      user.id,
      user.role,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Pending volunteer applications retrieved successfully',
      data: volunteers,
      timestamp: new Date().toISOString(),
    };
  }
}
