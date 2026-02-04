import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateUserDto,
  UpdatePasswordDto,
  UpdateOnboardingProfileDto,
  UserResponseDto,
  PublicUserResponseDto,
  VolunteerProfileResponseDto,
  MentorProfileResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { CloudinaryService } from '../../config/cloudinary.service';
import { ApiResponse } from '../../common/interfaces/api-response.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Get current user profile (Private - Authenticated)
   * GET /users/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.findByIdOrFail(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Profile retrieved successfully',
      data: plainToInstance(UserResponseDto, user),
    };
  }

  /**
   * Update current user profile (Only by user itself)
   * PUT /users/profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.update(req.user.id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: plainToInstance(UserResponseDto, user),
    };
  }

  /**
   * Upload avatar for current user
   * POST /users/profile/avatar
   */
  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<{ avatarUrl: string }>> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    // Get current user
    const user = await this.usersService.findByIdOrFail(req.user.id);

    // Delete old avatar from Cloudinary if exists
    if (user.avatarUrl) {
      const publicId = this.cloudinaryService.extractPublicId(user.avatarUrl);
      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId);
      }
    }

    // Upload new avatar
    const result = await this.cloudinaryService.uploadFile(file, 'avatars');

    // Update user's avatarUrl
    await this.usersService.update(req.user.id, {
      avatarUrl: result.secure_url,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: result.secure_url,
      },
    };
  }

  /**
   * Update current user password
   * PATCH /users/profile/password
   */
  @Patch('profile/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<ApiResponse<null>> {
    await this.usersService.updatePassword(req.user.id, updatePasswordDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
      data: null,
    };
  }

  /**
   * Update current user onboarding profile (skills, interests, bio, etc)
   * PUT /users/profile/onboarding
   */
  @Put('profile/onboarding')
  @UseGuards(JwtAuthGuard)
  async updateOnboardingProfile(
    @Req() req,
    @Body() updateOnboardingProfileDto: UpdateOnboardingProfileDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.updateOnboardingProfile(
      req.user.id,
      updateOnboardingProfileDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Onboarding profile updated successfully',
      data: plainToInstance(UserResponseDto, user),
    };
  }

  /**
   * Delete current user account
   * DELETE /users/profile
   */
  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteProfile(@Req() req): Promise<ApiResponse<null>> {
    await this.usersService.remove(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Account deleted successfully',
      data: null,
    };
  }

  /**
   * Get all users (with pagination) - Protected
   * GET /users?page=1&limit=10
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<
    ApiResponse<{
      users: PublicUserResponseDto[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>
  > {
    const result = await this.usersService.findAll(page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: {
        users: plainToInstance(PublicUserResponseDto, result.data),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
    };
  }

  /**
   * Search users by keyword - Protected
   * GET /users/search?keyword=john&page=1&limit=10
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(
    @Query('keyword') keyword: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<
    ApiResponse<{
      users: PublicUserResponseDto[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>
  > {
    const result = await this.usersService.search(keyword, page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Search completed successfully',
      data: {
        users: plainToInstance(PublicUserResponseDto, result.data),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
    };
  }

  /**
   * Get volunteer profile by username (Public - No authentication required)
   * GET /users/volunteer/username/:username
   */
  @Get('volunteer/username/:username')
  async getVolunteerProfile(
    @Param('username') username: string,
  ): Promise<ApiResponse<VolunteerProfileResponseDto>> {
    const volunteerProfile = await this.usersService.getVolunteerProfileByUsername(username);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: plainToInstance(VolunteerProfileResponseDto, volunteerProfile, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get mentor profile by username (Public - No authentication required)
   * GET /users/mentor/username/:username
   */
  @Get('mentor/username/:username')
  async getMentorProfile(
    @Param('username') username: string,
  ): Promise<ApiResponse<MentorProfileResponseDto>> {
    const mentorProfile = await this.usersService.getMentorProfileByUsername(username);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: plainToInstance(MentorProfileResponseDto, mentorProfile, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Get user by username (Public - No authentication required)
   * GET /users/username/:username
   */
  @Get('username/:username')
  async findByUsername(
    @Param('username') username: string,
  ): Promise<ApiResponse<PublicUserResponseDto>> {
    const user = await this.usersService.findByUsernameOrFail(username);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: plainToInstance(PublicUserResponseDto, user),
    };
  }

  /**
   * Get user by ID (Public - No authentication required)
   * GET /users/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<PublicUserResponseDto>> {
    const user = await this.usersService.findByIdOrFail(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: plainToInstance(PublicUserResponseDto, user),
    };
  }

  /**
   * Get user statistics by ID
   * GET /users/:id/statistics
   */
  @Get(':id/statistics')
  async getUserStatistics(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<any>> {
    const statistics = await this.usersService.getUserStatistics(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User statistics retrieved successfully',
      data: statistics,
    };
  }

  /**
   * Update user by ID (Admin only - Protected)
   * PUT /users/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: plainToInstance(UserResponseDto, user),
    };
  }

  /**
   * Delete user by ID (Admin only - Protected)
   * DELETE /users/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.usersService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
      data: null,
    };
  }

  /**
   * Submit survey for thesis research (Pre-test, Post-test, Satisfaction)
   * POST /users/survey
   */
  @Post('survey')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitSurvey(
    @Req() req: any,
    @Body() surveyDto: any,
  ): Promise<ApiResponse<{ message: string }>> {
    const userId = req.user.id || req.user.userId;
    const result = await this.usersService.submitSurvey(userId, surveyDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Survey submitted successfully',
      data: result,
    };
  }
}
