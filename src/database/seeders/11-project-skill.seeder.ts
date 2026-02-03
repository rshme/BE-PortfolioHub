import { DataSource } from 'typeorm';
import { ProjectSkill } from '../../modules/projects/entities/project-skill.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';

export class ProjectSkillSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectSkillRepository = dataSource.getRepository(ProjectSkill);
    const projectRepository = dataSource.getRepository(Project);
    const skillRepository = dataSource.getRepository(Skill);

    // Check if data already exists
    const count = await projectSkillRepository.count();
    if (count > 0) {
      console.log('✅ Project skills already seeded, skipping...');
      return;
    }

    // Get projects and skills
    const projects = await projectRepository.find();
    const skills = await skillRepository.find();

    if (projects.length === 0 || skills.length === 0) {
      console.log(
        '⚠️ No projects or skills found, skipping project skills seeding',
      );
      return;
    }

    // Helper function to get random skills
    const getRandomSkills = (count: number) => {
      const shuffled = [...skills].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const projectSkills: Array<{
      projectId: string;
      skillId: string;
      isMandatory: boolean;
    }> = [];

    // Assign skills to each project (3-8 skills per project)
    for (const project of projects) {
      const skillCount = Math.floor(Math.random() * 6) + 3; // 3 to 8 skills
      const selectedSkills = getRandomSkills(skillCount);

      for (let i = 0; i < selectedSkills.length; i++) {
        const skill = selectedSkills[i];
        projectSkills.push({
          projectId: project.id,
          skillId: skill.id,
          // First 2-3 skills are mandatory, rest are optional
          isMandatory: i < Math.floor(Math.random() * 2) + 2,
        });
      }
    }

    await projectSkillRepository.save(projectSkills);
    console.log(`✅ Seeded ${projectSkills.length} project skills`);
  }
}
