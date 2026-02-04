import { DataSource } from 'typeorm';
import { ProjectSkill } from '../../modules/projects/entities/project-skill.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';
import { UserSkill } from '../../modules/users/entities/user-skill.entity';
import { ProjectLevel } from '../../common/enums/project-level.enum';

export class ProjectSkillSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectSkillRepository = dataSource.getRepository(ProjectSkill);
    const projectRepository = dataSource.getRepository(Project);
    const skillRepository = dataSource.getRepository(Skill);
    const userSkillRepository = dataSource.getRepository(UserSkill);

    // Check if data already exists
    const count = await projectSkillRepository.count();
    if (count > 0) {
      console.log('✅ Project skills already seeded, skipping...');
      return;
    }

    // Get projects, skills, and user skills
    const projects = await projectRepository.find({ relations: ['creator'] });
    const skills = await skillRepository.find();
    const allUserSkills = await userSkillRepository.find();

    if (projects.length === 0 || skills.length === 0) {
      console.log(
        '⚠️ No projects or skills found, skipping project skills seeding',
      );
      return;
    }

    // Create a map of commonly used skills by users for overlap
    const userSkillCounts = new Map<string, number>();
    allUserSkills.forEach(us => {
      const count = userSkillCounts.get(us.skillId) || 0;
      userSkillCounts.set(us.skillId, count + 1);
    });

    // Get most common skills (used by many users)
    const commonSkills = Array.from(userSkillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.floor(skills.length * 0.6)) // Top 60% most common
      .map(([skillId]) => skills.find(s => s.id === skillId))
      .filter(s => s !== undefined) as Skill[];

    // Categorize skills for better project assignment
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
      ['Git', 'GraphQL', 'REST API', 'Microservices', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Agile/Scrum', 'Testing', 'Security'].includes(s.name)
    );

    // Helper to get skills with guaranteed overlap (30-80%)
    const getProjectSkills = (project: Project, creatorSkills: Skill[]) => {
      let baseSkillCount: number;
      
      // Skill count based on project level
      if (project.level === ProjectLevel.BEGINNER) {
        baseSkillCount = Math.floor(Math.random() * 3) + 4; // 4-6 skills
      } else if (project.level === ProjectLevel.INTERMEDIATE) {
        baseSkillCount = Math.floor(Math.random() * 3) + 6; // 6-8 skills
      } else {
        baseSkillCount = Math.floor(Math.random() * 3) + 8; // 8-10 skills
      }

      // Calculate overlap percentage (30-80%)
      const overlapPercentage = Math.random() * 0.5 + 0.3; // 30% to 80%
      const overlapCount = Math.max(2, Math.floor(baseSkillCount * overlapPercentage));
      const uniqueCount = baseSkillCount - overlapCount;

      const selectedSkills: Skill[] = [];
      const usedSkillIds = new Set<string>();

      // 1. Add overlapping skills from creator and common skills
      const overlapPool = creatorSkills.length > 0 ? creatorSkills : commonSkills;
      const shuffledOverlap = [...overlapPool].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < overlapCount && i < shuffledOverlap.length; i++) {
        const skill = shuffledOverlap[i];
        if (!usedSkillIds.has(skill.id)) {
          selectedSkills.push(skill);
          usedSkillIds.add(skill.id);
        }
      }

      // 2. Add unique skills from relevant categories based on project name
      const projectName = project.name.toLowerCase();
      let relevantSkills: Skill[] = [];
      
      if (projectName.includes('mobile') || projectName.includes('app')) {
        relevantSkills = [...mobileSkills, ...frontendSkills, ...toolSkills];
      } else if (projectName.includes('data') || projectName.includes('ai') || projectName.includes('ml')) {
        relevantSkills = [...backendSkills, ...databaseSkills, ...toolSkills];
      } else if (projectName.includes('platform') || projectName.includes('web') || projectName.includes('learning')) {
        relevantSkills = [...frontendSkills, ...backendSkills, ...databaseSkills, ...toolSkills];
      } else if (projectName.includes('cloud') || projectName.includes('deploy') || projectName.includes('infra')) {
        relevantSkills = [...devopsSkills, ...backendSkills, ...toolSkills];
      } else {
        // General project - mix of everything
        relevantSkills = [...frontendSkills, ...backendSkills, ...databaseSkills, ...toolSkills];
      }

      // Remove already selected skills from relevant pool
      const uniquePool = relevantSkills.filter(s => !usedSkillIds.has(s.id));
      const shuffledUnique = [...uniquePool].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < uniqueCount && i < shuffledUnique.length; i++) {
        const skill = shuffledUnique[i];
        if (!usedSkillIds.has(skill.id)) {
          selectedSkills.push(skill);
          usedSkillIds.add(skill.id);
        }
      }

      // If still not enough skills, add from common skills
      if (selectedSkills.length < baseSkillCount) {
        const remaining = baseSkillCount - selectedSkills.length;
        const remainingPool = commonSkills.filter(s => !usedSkillIds.has(s.id));
        const shuffledRemaining = [...remainingPool].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < remaining && i < shuffledRemaining.length; i++) {
          const skill = shuffledRemaining[i];
          selectedSkills.push(skill);
          usedSkillIds.add(skill.id);
        }
      }

      return selectedSkills;
    };

    const projectSkills: Array<{
      projectId: string;
      skillId: string;
      isMandatory: boolean;
    }> = [];

    // Assign skills to each project with guaranteed overlap
    for (const project of projects) {
      // Get creator's skills for overlap
      const creatorUserSkills = allUserSkills.filter(us => us.userId === project.creatorId);
      const creatorSkills = creatorUserSkills
        .map(us => skills.find(s => s.id === us.skillId))
        .filter(s => s !== undefined) as Skill[];

      const selectedSkills = getProjectSkills(project, creatorSkills);

      for (let i = 0; i < selectedSkills.length; i++) {
        const skill = selectedSkills[i];
        projectSkills.push({
          projectId: project.id,
          skillId: skill.id,
          // First 40-60% skills are mandatory, rest are optional
          isMandatory: i < Math.floor(selectedSkills.length * (Math.random() * 0.2 + 0.4)),
        });
      }
    }

    await projectSkillRepository.save(projectSkills);
    console.log(`✅ Seeded ${projectSkills.length} project skills`);
  }
}
