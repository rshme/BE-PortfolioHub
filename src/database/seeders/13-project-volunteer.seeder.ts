import { DataSource } from 'typeorm';
import { ProjectVolunteer } from '../../modules/projects/entities/project-volunteer.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export class ProjectVolunteerSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectVolunteerRepository =
      dataSource.getRepository(ProjectVolunteer);
    const projectRepository = dataSource.getRepository(Project);
    const userRepository = dataSource.getRepository(User);

    // Check if data already exists
    const count = await projectVolunteerRepository.count();
    if (count > 0) {
      console.log('✅ Project volunteers already seeded, skipping...');
      return;
    }

    // Get projects and volunteers (exclude DRAFT projects)
    const projects = await projectRepository.find({
      where: [
        { status: ProjectStatus.ACTIVE },
        { status: ProjectStatus.IN_PROGRESS },
        { status: ProjectStatus.COMPLETED },
        { status: ProjectStatus.ON_HOLD },
      ],
    });
    const volunteers = await userRepository.find({
      where: { role: UserRole.VOLUNTEER },
    });

    if (projects.length === 0 || volunteers.length === 0) {
      console.log(
        '⚠️ No active projects or volunteers found, skipping project volunteers seeding',
      );
      return;
    }

    const projectVolunteers: Array<{
      projectId: string;
      userId: string;
      invitedBy: undefined;
      applicationMessage: string;
      status: VolunteerStatus;
    }> = [];

    // Assign 4-8 volunteers to each non-draft project
    for (const project of projects) {
      const volunteerCount = Math.floor(Math.random() * 5) + 4; // 4 to 8 volunteers
      const shuffledVolunteers = [...volunteers].sort(
        () => 0.5 - Math.random(),
      );
      const selectedVolunteers = shuffledVolunteers.slice(0, volunteerCount);

      for (const volunteer of selectedVolunteers) {
        const statusRand = Math.random();
        let status: VolunteerStatus;
        
        if (statusRand > 0.3) {
          status = VolunteerStatus.PENDING;
        } else if (statusRand > 0.8) {
          status = VolunteerStatus.REJECTED;
        } else {
          status = VolunteerStatus.ACTIVE;
        }

        projectVolunteers.push({
          projectId: project.id,
          userId: volunteer.id,
          invitedBy: undefined, // Application, not invitation
          applicationMessage: `I'm excited to contribute to this project and learn new skills!`,
          status,
        });
      }
    }

    await projectVolunteerRepository.save(projectVolunteers);
    console.log(`✅ Seeded ${projectVolunteers.length} project volunteers`);
  }
}
