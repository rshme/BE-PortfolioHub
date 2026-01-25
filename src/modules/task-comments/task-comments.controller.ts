import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto, UpdateTaskCommentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiResponse } from '../../common/interfaces/response.interface';
import { TaskComment } from './entities/task-comment.entity';
import { TaskCommentWithReplies } from './interfaces';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createTaskCommentDto: CreateTaskCommentDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<TaskComment>> {
    const comment = await this.taskCommentsService.create(
      taskId,
      createTaskCommentDto,
      user.id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Comment created successfully',
      data: comment,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllByTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<TaskCommentWithReplies[]>> {
    const comments = await this.taskCommentsService.findAllByTask(
      taskId,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Comments retrieved successfully',
      data: comments,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<TaskComment>> {
    const comment = await this.taskCommentsService.findOne(id, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Comment retrieved successfully',
      data: comment,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskCommentDto: UpdateTaskCommentDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<TaskComment>> {
    const comment = await this.taskCommentsService.update(
      id,
      updateTaskCommentDto,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Comment updated successfully',
      data: comment,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<null>> {
    await this.taskCommentsService.remove(id, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Comment deleted successfully',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
