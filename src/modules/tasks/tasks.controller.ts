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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  AssignTaskDto,
  QueryTaskDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiResponse,
  PaginatedResponse,
} from '../../common/interfaces/response.interface';
import { Task } from './entities/task.entity';
import { TaskStatistics } from './interfaces';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.create(
      projectId,
      createTaskDto,
      user.id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Task created successfully',
      data: task,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() queryDto: QueryTaskDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponse<Task>> {
    const result = await this.tasksService.findAll(
      projectId,
      queryDto,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Tasks retrieved successfully',
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<TaskStatistics>> {
    const statistics = await this.tasksService.getTaskStatistics(
      projectId,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Task statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.findOne(id, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Task retrieved successfully',
      data: task,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.update(id, updateTaskDto, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Task updated successfully',
      data: task,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.updateStatus(
      id,
      updateStatusDto,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Task status updated successfully',
      data: task,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<Task>> {
    const task = await this.tasksService.assignTask(id, assignTaskDto, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Task assigned successfully',
      data: task,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<null>> {
    await this.tasksService.remove(id, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Task deleted successfully',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
