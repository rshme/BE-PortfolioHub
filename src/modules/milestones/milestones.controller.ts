import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiResponse } from '../../common/interfaces/response.interface';
import { MilestoneWithStatistics } from './interfaces/milestone.interface';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post('projects/:projectId')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createMilestoneDto: CreateMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<MilestoneWithStatistics>> {
    const milestone = await this.milestonesService.create(
      projectId,
      createMilestoneDto,
      user.id,
      user.role,
    );

    return {
      statusCode: 201,
      message: 'Milestone created successfully',
      data: milestone,
    };
  }

  @Get('projects/:projectId')
  async findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<MilestoneWithStatistics[]>> {
    const milestones = await this.milestonesService.findAllByProject(
      projectId,
      user.id,
      user.role,
    );

    return {
      statusCode: 200,
      message: 'Milestones retrieved successfully',
      data: milestones,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<MilestoneWithStatistics>> {
    const milestone = await this.milestonesService.findOne(
      id,
      user.id,
      user.role,
    );

    return {
      statusCode: 200,
      message: 'Milestone retrieved successfully',
      data: milestone,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<MilestoneWithStatistics>> {
    const milestone = await this.milestonesService.update(
      id,
      updateMilestoneDto,
      user.id,
      user.role,
    );

    return {
      statusCode: 200,
      message: 'Milestone updated successfully',
      data: milestone,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<void>> {
    await this.milestonesService.remove(id, user.id, user.role);

    return {
      statusCode: 200,
      message: 'Milestone deleted successfully',
    };
  }

  @Get(':id/statistics')
  async getStatistics(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<any>> {
    const statistics = await this.milestonesService.getStatistics(
      id,
      user.id,
      user.role,
    );

    return {
      statusCode: 200,
      message: 'Milestone statistics retrieved successfully',
      data: statistics,
    };
  }
}
