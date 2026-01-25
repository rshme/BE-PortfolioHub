import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ProjectVolunteer } from '../../modules/projects/entities/project-volunteer.entity';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export const seedProjectVolunteers = async (
  dataSource: DataSource,
): Promise<void> => {
  const projectVolunteerRepository = dataSource.getRepository(ProjectVolunteer);
  const projectRepository = dataSource.getRepository(Project);
  const userRepository = dataSource.getRepository(User);

  // Check if project volunteers already exist
  const existingCount = await projectVolunteerRepository.count();
  if (existingCount > 0) {
    console.log('Project volunteers already exist, skipping seed...');
    return;
  }

  const projects = await projectRepository.find();
  if (projects.length === 0) {
    console.log('⚠️  No projects found. Please run project seeder first.');
    return;
  }

  // Get volunteers
  const volunteers = await userRepository.find({
    where: { role: UserRole.VOLUNTEER },
  });

  if (volunteers.length === 0) {
    console.log('⚠️  No volunteers found. Please run user seeder first.');
    return;
  }

  const [alice, bob, charlie, eva, frank] = volunteers;

  // Define volunteer assignments
  const volunteerAssignments = [
    // EduConnect
    {
      projectName: 'EduConnect - Online Learning Platform',
      volunteer: alice,
      status: VolunteerStatus.ACTIVE,
      contributionScore: 85,
      tasksCompleted: 12,
      joinedAt: new Date('2026-01-22'),
    },
    {
      projectName: 'EduConnect - Online Learning Platform',
      volunteer: bob,
      status: VolunteerStatus.ACTIVE,
      contributionScore: 72,
      tasksCompleted: 8,
      joinedAt: new Date('2026-01-23'),
    },
    {
      projectName: 'EduConnect - Online Learning Platform',
      volunteer: charlie,
      status: VolunteerStatus.PENDING,
      contributionScore: 0,
      tasksCompleted: 0,
      joinedAt: null,
    },

    // GreenCart
    {
      projectName: 'GreenCart - Sustainable Shopping App',
      volunteer: eva,
      status: VolunteerStatus.ACTIVE,
      contributionScore: 92,
      tasksCompleted: 15,
      joinedAt: new Date('2026-01-16'),
    },
    {
      projectName: 'GreenCart - Sustainable Shopping App',
      volunteer: frank,
      status: VolunteerStatus.ACTIVE,
      contributionScore: 68,
      tasksCompleted: 9,
      joinedAt: new Date('2026-01-18'),
    },
    {
      projectName: 'GreenCart - Sustainable Shopping App',
      volunteer: alice,
      status: VolunteerStatus.LEFT,
      contributionScore: 45,
      tasksCompleted: 5,
      joinedAt: new Date('2026-01-15'),
    },

    // HealthTracker AI
    {
      projectName: 'HealthTracker AI - Personal Health Assistant',
      volunteer: frank,
      status: VolunteerStatus.ACTIVE,
      contributionScore: 88,
      tasksCompleted: 11,
      joinedAt: new Date('2026-01-11'),
    },
    {
      projectName: 'HealthTracker AI - Personal Health Assistant',
      volunteer: charlie,
      status: VolunteerStatus.ACTIVE,
      contributionScore: 76,
      tasksCompleted: 10,
      joinedAt: new Date('2026-01-12'),
    },

    // CodeCollab
    {
      projectName: 'CodeCollab - Real-time Collaborative IDE',
      volunteer: alice,
      status: VolunteerStatus.PENDING,
      contributionScore: 0,
      tasksCompleted: 0,
      joinedAt: null,
    },
    {
      projectName: 'CodeCollab - Real-time Collaborative IDE',
      volunteer: bob,
      status: VolunteerStatus.PENDING,
      contributionScore: 0,
      tasksCompleted: 0,
      joinedAt: null,
    },

    // VolunteerHub
    {
      projectName: 'VolunteerHub - Community Service Platform',
      volunteer: bob,
      status: VolunteerStatus.PENDING,
      contributionScore: 0,
      tasksCompleted: 0,
      joinedAt: null,
    },

    // SmartFinance (Completed project)
    {
      projectName: 'SmartFinance - Personal Budget Manager',
      volunteer: charlie,
      status: VolunteerStatus.LEFT,
      contributionScore: 95,
      tasksCompleted: 20,
      joinedAt: new Date('2025-08-02'),
    },
    {
      projectName: 'SmartFinance - Personal Budget Manager',
      volunteer: bob,
      status: VolunteerStatus.LEFT,
      contributionScore: 87,
      tasksCompleted: 16,
      joinedAt: new Date('2025-08-03'),
    },
    {
      projectName: 'SmartFinance - Personal Budget Manager',
      volunteer: eva,
      status: VolunteerStatus.LEFT,
      contributionScore: 91,
      tasksCompleted: 18,
      joinedAt: new Date('2025-08-01'),
    },
  ];

  let totalCreated = 0;

  for (const assignment of volunteerAssignments) {
    const project = projects.find((p) => p.name === assignment.projectName);
    if (!project || !assignment.volunteer) continue;

    const projectVolunteer = projectVolunteerRepository.create({
      project,
      user: assignment.volunteer,
      status: assignment.status,
      contributionScore: assignment.contributionScore,
      tasksCompleted: assignment.tasksCompleted,
      ...(assignment.joinedAt && { joinedAt: assignment.joinedAt }),
    });

    await projectVolunteerRepository.save(projectVolunteer);
    totalCreated++;
  }

  console.log(
    `✅ Successfully assigned ${totalCreated} volunteers to projects`,
  );
};
