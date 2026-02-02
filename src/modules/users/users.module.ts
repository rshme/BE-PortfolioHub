import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserSkill } from './entities/user-skill.entity';
import { UserInterest } from './entities/user-interest.entity';
import { CloudinaryService } from '../../config/cloudinary.service';
import { AuthModule } from '../auth/auth.module';
import { Project } from '../projects/entities/project.entity';
import { ProjectVolunteer } from '../projects/entities/project-volunteer.entity';
import { ProjectMentor } from '../projects/entities/project-mentor.entity';
import { Task } from '../tasks/entities/task.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserBadge,
      UserSkill,
      UserInterest,
      Project,
      ProjectVolunteer,
      ProjectMentor,
      Task,
      Testimonial,
      Skill,
      Category,
      Organization,
    ]),
    ConfigModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
