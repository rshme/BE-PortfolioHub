import { DataSource } from 'typeorm';
import { Skill } from '../../modules/skills/entities/skill.entity';

export class SkillSeeder {
  // Skill categories for better overlap management
  static readonly SKILL_CATEGORIES = {
    FRONTEND: 'frontend',
    BACKEND: 'backend',
    DATABASE: 'database',
    DEVOPS: 'devops',
    MOBILE: 'mobile',
    TOOLS: 'tools',
  };

  async run(dataSource: DataSource): Promise<void> {
    const skillRepository = dataSource.getRepository(Skill);

    // Check if data already exists
    const count = await skillRepository.count();
    if (count > 0) {
      console.log('✅ Skills already seeded, skipping...');
      return;
    }

    const skills = [
      // Programming Languages
      { name: 'JavaScript', icon: '🟨' },
      { name: 'TypeScript', icon: '🔷' },
      { name: 'Python', icon: '🐍' },
      { name: 'Java', icon: '☕' },
      { name: 'C++', icon: '⚡' },
      { name: 'Go', icon: '🐹' },
      { name: 'Rust', icon: '🦀' },
      { name: 'PHP', icon: '🐘' },
      { name: 'Ruby', icon: '💎' },
      { name: 'Swift', icon: '🍎' },
      { name: 'Kotlin', icon: '🤖' },

      // Frontend Frameworks & Libraries
      { name: 'React', icon: '⚛️' },
      { name: 'Vue.js', icon: '💚' },
      { name: 'Angular', icon: '🅰️' },
      { name: 'Next.js', icon: '▲' },
      { name: 'Svelte', icon: '🔥' },
      { name: 'Tailwind CSS', icon: '🎨' },
      { name: 'Bootstrap', icon: '🅱️' },

      // Backend Frameworks
      { name: 'Node.js', icon: '🟢' },
      { name: 'NestJS', icon: '🐈' },
      { name: 'Express.js', icon: '🚂' },
      { name: 'Django', icon: '🎸' },
      { name: 'Flask', icon: '🌶️' },
      { name: 'Spring Boot', icon: '🍃' },
      { name: 'Laravel', icon: '🔴' },
      { name: 'Ruby on Rails', icon: '🛤️' },

      // Databases
      { name: 'PostgreSQL', icon: '🐘' },
      { name: 'MySQL', icon: '🐬' },
      { name: 'MongoDB', icon: '🍃' },
      { name: 'Redis', icon: '🔴' },
      { name: 'SQLite', icon: '💾' },
      { name: 'Firebase', icon: '🔥' },

      // DevOps & Cloud
      { name: 'Docker', icon: '🐳' },
      { name: 'Kubernetes', icon: '☸️' },
      { name: 'AWS', icon: '☁️' },
      { name: 'Azure', icon: '🔷' },
      { name: 'Google Cloud', icon: '☁️' },
      { name: 'CI/CD', icon: '🔄' },
      { name: 'Terraform', icon: '🌍' },

      // Mobile Development
      { name: 'React Native', icon: '📱' },
      { name: 'Flutter', icon: '🦋' },
      { name: 'iOS Development', icon: '🍎' },
      { name: 'Android Development', icon: '🤖' },

      // Tools & Others
      { name: 'Git', icon: '📚' },
      { name: 'GraphQL', icon: '🔷' },
      { name: 'REST API', icon: '🔗' },
      { name: 'Microservices', icon: '🏗️' },
      { name: 'Machine Learning', icon: '🤖' },
      { name: 'Data Analysis', icon: '📊' },
      { name: 'UI/UX Design', icon: '🎨' },
      { name: 'Agile/Scrum', icon: '🏃' },
      { name: 'Testing', icon: '🧪' },
      { name: 'Security', icon: '🔒' },
    ];

    await skillRepository.save(skills);
    console.log(`✅ Seeded ${skills.length} skills`);
  }
}
