import { DataSource } from 'typeorm';
import { UserSkill } from '../../modules/users/entities/user-skill.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserSkillSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userSkillRepository = dataSource.getRepository(UserSkill);
    const userRepository = dataSource.getRepository(User);
    const skillRepository = dataSource.getRepository(Skill);

    // Check if data already exists
    const count = await userSkillRepository.count();
    if (count > 0) {
      console.log('✅ User skills already seeded, skipping...');
      return;
    }

    // Get users and skills
    const users = await userRepository.find();
    const skills = await skillRepository.find();

    if (users.length === 0 || skills.length === 0) {
      console.log('⚠️ No users or skills found, skipping user skills seeding');
      return;
    }

    // Categorize skills by name patterns for better distribution
    const frontendSkills = skills.filter(s => 
      ['React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'Tailwind CSS', 'Bootstrap', 'JavaScript', 'TypeScript'].includes(s.name)
    );
    const backendSkills = skills.filter(s => 
      ['Node.js', 'NestJS', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'Python', 'Java', 'PHP', 'Go', 'Rust'].includes(s.name)
    );
    const databaseSkills = skills.filter(s => 
      ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase'].includes(s.name)
    );
    const devopsSkills = skills.filter(s => 
      ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Terraform'].includes(s.name)
    );
    const mobileSkills = skills.filter(s => 
      ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Swift', 'Kotlin'].includes(s.name)
    );
    const toolSkills = skills.filter(s => 
      ['Git', 'GraphQL', 'REST API', 'Microservices', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Agile/Scrum', 'Testing', 'Security', 'C++', 'Ruby'].includes(s.name)
    );

    // Helper function to get skills from specific pools with overlap
    const getSkillsFromPools = (pools: Skill[][], minCount: number, maxCount: number) => {
      const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
      const allPoolSkills: Skill[] = [];
      
      // Combine all pools
      pools.forEach(pool => allPoolSkills.push(...pool));
      
      // Remove duplicates
      const uniqueSkills = Array.from(new Map(allPoolSkills.map(s => [s.id, s])).values());
      
      // Shuffle and select
      const shuffled = [...uniqueSkills].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    const userSkills: Array<{ userId: string; skillId: string }> = [];

    // Assign skills based on role for better overlap with projects
    for (const user of users) {
      let selectedSkills: Skill[] = [];

      // Role-based skill assignment with common pools to ensure overlap
      if (user.role === UserRole.PROJECT_OWNER) {
        // Project owners have diverse skills (5-8 skills)
        selectedSkills = getSkillsFromPools(
          [frontendSkills, backendSkills, databaseSkills, toolSkills],
          5, 8
        );
      } else if (user.role === UserRole.MENTOR) {
        // Mentors have deep expertise (6-9 skills)
        selectedSkills = getSkillsFromPools(
          [backendSkills, frontendSkills, databaseSkills, devopsSkills, toolSkills],
          6, 9
        );
      } else if (user.role === UserRole.VOLUNTEER) {
        // Volunteers have focused skills (4-7 skills)
        const specialization = Math.random();
        if (specialization < 0.3) {
          // Frontend focused
          selectedSkills = getSkillsFromPools([frontendSkills, toolSkills], 4, 7);
        } else if (specialization < 0.6) {
          // Backend focused
          selectedSkills = getSkillsFromPools([backendSkills, databaseSkills, toolSkills], 4, 7);
        } else if (specialization < 0.8) {
          // Full-stack
          selectedSkills = getSkillsFromPools([frontendSkills, backendSkills, databaseSkills], 4, 7);
        } else {
          // Mobile or specialized
          selectedSkills = getSkillsFromPools([mobileSkills, frontendSkills, toolSkills], 4, 7);
        }
      } else {
        // Default: random skills (3-6 skills)
        selectedSkills = getSkillsFromPools(
          [frontendSkills, backendSkills, databaseSkills, mobileSkills, devopsSkills, toolSkills],
          3, 6
        );
      }

      for (const skill of selectedSkills) {
        userSkills.push({
          userId: user.id,
          skillId: skill.id,
        });
      }
    }

    await userSkillRepository.save(userSkills);
    console.log(`✅ Seeded ${userSkills.length} user skills`);
  }
}
