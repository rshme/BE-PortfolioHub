import { DataSource } from 'typeorm';
import { ProjectMentor } from '../../modules/projects/entities/project-mentor.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export class ProjectMentorSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectMentorRepository = dataSource.getRepository(ProjectMentor);
    const projectRepository = dataSource.getRepository(Project);
    const userRepository = dataSource.getRepository(User);

    // Check if data already exists
    const count = await projectMentorRepository.count();
    if (count > 0) {
      console.log('✅ Project mentors already seeded, skipping...');
      return;
    }

    // Get projects and mentors (exclude DRAFT projects)
    const projects = await projectRepository.find({
      where: [
        { status: ProjectStatus.ACTIVE },
        { status: ProjectStatus.IN_PROGRESS },
        { status: ProjectStatus.COMPLETED },
        { status: ProjectStatus.ON_HOLD },
      ],
    });
    const mentors = await userRepository.find({
      where: { role: UserRole.MENTOR },
    });

    if (projects.length === 0 || mentors.length === 0) {
      console.log(
        '⚠️ No active projects or mentors found, skipping project mentors seeding',
      );
      return;
    }

    const projectMentors: Array<{
      projectId: string;
      userId: string;
      invitedBy: string;
      applicationMessage: string;
      expertiseAreas: string[];
      status: MentorStatus;
    }> = [];

    // Assign 2-4 mentors to each non-draft project
    for (const project of projects) {
      const mentorCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 mentors
      const shuffledMentors = [...mentors].sort(() => 0.5 - Math.random());
      const selectedMentors = shuffledMentors.slice(0, mentorCount);

      for (const mentor of selectedMentors) {
        const status = Math.random() > 0.5 ? MentorStatus.ACTIVE : MentorStatus.PENDING;
        
        projectMentors.push({
          projectId: project.id,
          userId: mentor.id,
          invitedBy: project.creatorId,
          applicationMessage: `I would love to mentor this project and share my expertise.`,
          expertiseAreas: ['Code Review', 'Architecture', 'Best Practices'],
          status,
        });
      }
    }

    await projectMentorRepository.save(projectMentors);
    console.log(`✅ Seeded ${projectMentors.length} project mentors`);
  }
}
