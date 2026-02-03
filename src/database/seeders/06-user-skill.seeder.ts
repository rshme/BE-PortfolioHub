import { DataSource } from 'typeorm';
import { UserSkill } from '../../modules/users/entities/user-skill.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';

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

    // Helper function to get random skills
    const getRandomSkills = (count: number) => {
      const shuffled = [...skills].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const userSkills: Array<{ userId: string; skillId: string }> = [];

    // Assign skills to each user (3-8 skills per user)
    for (const user of users) {
      const skillCount = Math.floor(Math.random() * 6) + 3; // 3 to 8 skills
      const selectedSkills = getRandomSkills(skillCount);

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
