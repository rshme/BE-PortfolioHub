import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { SimilarityService } from './similarity.service';
import { Project } from './entities/project.entity';
import { ProjectCategory } from './entities/project-category.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { ProjectMentor } from './entities/project-mentor.entity';
import { ProjectVolunteer } from './entities/project-volunteer.entity';
import { UserSkill } from '../users/entities/user-skill.entity';
import { CloudinaryService } from '../../config/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectCategory,
      ProjectSkill,
      ProjectMentor,
      ProjectVolunteer,
      UserSkill,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, SimilarityService, CloudinaryService],
  exports: [ProjectsService, SimilarityService],
})
export class ProjectsModule {}
