import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ProjectMentor } from '../../modules/projects/entities/project-mentor.entity';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export const seedProjectMentors = async (dataSource: DataSource): Promise<void> => {
  const projectMentorRepository = dataSource.getRepository(ProjectMentor);
  const projectRepository = dataSource.getRepository(Project);
  const userRepository = dataSource.getRepository(User);

  // Check if project mentors already exist
  const existingCount = await projectMentorRepository.count();
  if (existingCount > 0) {
    console.log('Project mentors already exist, skipping seed...');
    return;
  }

  const projects = await projectRepository.find();
  if (projects.length === 0) {
    console.log('⚠️  No projects found. Please run project seeder first.');
    return;
  }

  // Get mentors
  const mentors = await userRepository.find({
    where: { role: UserRole.MENTOR },
  });

  if (mentors.length === 0) {
    console.log('⚠️  No mentors found. Please run user seeder first.');
    return;
  }

  const [mentor1, mentor2] = mentors;

  // Define mentor assignments
  const mentorAssignments = [
    {
      projectName: 'EduConnect - Online Learning Platform',
      mentor: mentor1,
      status: MentorStatus.ACTIVE,
      expertiseAreas: ['Full-stack Development', 'System Architecture', 'Database Design'],
      joinedAt: new Date('2026-01-20'),
    },
    {
      projectName: 'GreenCart - Sustainable Shopping App',
      mentor: mentor2,
      status: MentorStatus.ACTIVE,
      expertiseAreas: ['Mobile Development', 'UI/UX Design', 'React Native'],
      joinedAt: new Date('2026-01-16'),
    },
    {
      projectName: 'HealthTracker AI - Personal Health Assistant',
      mentor: mentor1,
      status: MentorStatus.ACTIVE,
      expertiseAreas: ['Machine Learning', 'Python', 'Healthcare Tech'],
      joinedAt: new Date('2026-01-12'),
    },
    {
      projectName: 'CodeCollab - Real-time Collaborative IDE',
      mentor: mentor2,
      status: MentorStatus.PENDING,
      expertiseAreas: ['Real-time Systems', 'WebRTC', 'TypeScript'],
      joinedAt: null,
    },
    {
      projectName: 'VolunteerHub - Community Service Platform',
      mentor: mentor1,
      status: MentorStatus.PENDING,
      expertiseAreas: ['Web Development', 'Next.js', 'NestJS'],
      joinedAt: null,
    },
    {
      projectName: 'SmartFinance - Personal Budget Manager',
      mentor: mentor2,
      status: MentorStatus.LEFT,
      expertiseAreas: ['Frontend Development', 'Vue.js', 'PHP/Laravel'],
      joinedAt: new Date('2025-08-05'),
      leftAt: new Date('2026-01-21'),
    },
  ];

  let totalCreated = 0;

  for (const assignment of mentorAssignments) {
    const project = projects.find(p => p.name === assignment.projectName);
    if (!project || !assignment.mentor) continue;

    const projectMentor = projectMentorRepository.create({
      project,
      user: assignment.mentor,
      status: assignment.status,
      expertiseAreas: assignment.expertiseAreas,
      ...(assignment.joinedAt && { joinedAt: assignment.joinedAt }),
      ...(assignment.leftAt && { leftAt: assignment.leftAt }),
    });

    await projectMentorRepository.save(projectMentor);
    console.log(`✓ Assigned mentor to: ${project.name}`);
    totalCreated++;
  }

  console.log(`✅ Successfully assigned ${totalCreated} mentors to projects`);
};
