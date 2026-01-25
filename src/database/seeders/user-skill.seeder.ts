import { DataSource } from 'typeorm';
import { UserSkill } from '../../modules/users/entities/user-skill.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';

export async function seedUserSkills(dataSource: DataSource): Promise<void> {
  const userSkillRepository = dataSource.getRepository(UserSkill);
  const userRepository = dataSource.getRepository(User);
  const skillRepository = dataSource.getRepository(Skill);

  // Check if user skills already exist
  const existingUserSkills = await userSkillRepository.count();
  if (existingUserSkills > 0) {
    console.log('User skills already exist, skipping seed...');
    return;
  }

  // Get all users
  const users = await userRepository.find();
  if (users.length === 0) {
    console.log('⚠️  No users found. Please run user seeder first.');
    return;
  }

  // Get all skills
  const skills = await skillRepository.find();
  if (skills.length === 0) {
    console.log('⚠️  No skills found. Please run skill seeder first.');
    return;
  }

  // Create skill map for easy lookup
  const skillMap = new Map(skills.map((skill) => [skill.name, skill.id]));

  // Define user skill assignments based on their roles and usernames
  const userSkillAssignments: Record<string, string[]> = {
    // Admin - Full stack & DevOps
    admin: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'PostgreSQL',
      'Docker',
      'Kubernetes',
      'AWS',
      'Git',
      'CI/CD',
    ],

    // John Mentor - Senior Backend Engineer
    johnmentor: [
      'Node.js',
      'TypeScript',
      'NestJS',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'Docker',
      'Microservices',
      'REST API',
      'GraphQL',
      'AWS',
      'Git',
    ],

    // Diana Expert - UI/UX Designer
    dianaexpert: [
      'Figma',
      'UI/UX Design',
      'HTML/CSS',
      'JavaScript',
      'React',
      'Tailwind CSS',
      'Responsive Design',
      'Prototyping',
    ],

    // Alice Volunteer - Full-stack Developer
    alicevolunteer: [
      'JavaScript',
      'TypeScript',
      'React',
      'Next.js',
      'Node.js',
      'Express.js',
      'PostgreSQL',
      'MongoDB',
      'REST API',
      'Git',
    ],

    // Bob Developer - Frontend Developer
    bobdev: [
      'JavaScript',
      'TypeScript',
      'React',
      'Vue.js',
      'HTML/CSS',
      'Tailwind CSS',
      'Responsive Design',
      'Git',
      'Figma',
    ],

    // Charlie Backend - Backend Engineer
    charliebackend: [
      'Java',
      'Spring Boot',
      'PostgreSQL',
      'MySQL',
      'Redis',
      'Docker',
      'REST API',
      'Microservices',
      'Git',
    ],

    // Eva Mobile - Mobile Developer
    evamobile: [
      'React Native',
      'Swift',
      'Kotlin',
      'Mobile Development',
      'JavaScript',
      'TypeScript',
      'Firebase',
      'Git',
    ],

    // Frank Data - Data Engineer
    frankdata: [
      'Python',
      'SQL',
      'PostgreSQL',
      'MongoDB',
      'Data Analysis',
      'Machine Learning',
      'Docker',
      'Git',
    ],

    // Sarah Owner - Product Manager
    sarahowner: ['Project Management', 'Agile', 'UI/UX Design', 'Figma', 'Git'],

    // Grace Founder - Startup Founder
    gracefounder: ['Project Management', 'Agile', 'Leadership', 'Git'],
  };

  const userSkills: Partial<UserSkill>[] = [];

  // Assign skills to users
  for (const user of users) {
    const skillNames = userSkillAssignments[user.username] || [];

    for (const skillName of skillNames) {
      const skillId = skillMap.get(skillName);

      if (skillId) {
        userSkills.push({
          userId: user.id,
          skillId: skillId,
        });
      } else {
        console.log(
          `⚠️  Skill "${skillName}" not found for user ${user.username}`,
        );
      }
    }
  }

  // Save user skills
  if (userSkills.length > 0) {
    await userSkillRepository.save(userSkills);
    console.log(`✅ Seeded ${userSkills.length} user skills successfully!`);

    // Show summary
    console.log('\n📊 User Skills Summary:');
    for (const user of users) {
      const userSkillCount = userSkills.filter(
        (us) => us.userId === user.id,
      ).length;
      if (userSkillCount > 0) {
        console.log(
          `   - ${user.fullName} (${user.username}): ${userSkillCount} skills`,
        );
      }
    }
  } else {
    console.log('⚠️  No user skills to seed.');
  }
}
