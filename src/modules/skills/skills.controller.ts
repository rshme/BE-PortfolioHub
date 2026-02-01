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
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponse } from '../../common/interfaces/response.interface';
import { Skill } from './entities/skill.entity';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createSkillDto: CreateSkillDto,
  ): Promise<ApiResponse<Skill>> {
    const skill = await this.skillsService.create(createSkillDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Skill created successfully',
      data: skill,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<Skill[]>> {
    const skills = await this.skillsService.findAll();

    return {
      statusCode: HttpStatus.OK,
      message: 'Skills retrieved successfully',
      data: skills,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<Skill>> {
    const skill = await this.skillsService.findOne(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Skill retrieved successfully',
      data: skill,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ): Promise<ApiResponse<Skill>> {
    const skill = await this.skillsService.update(id, updateSkillDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Skill updated successfully',
      data: skill,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.skillsService.remove(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Skill deleted successfully',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
