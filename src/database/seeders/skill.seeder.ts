import { DataSource } from 'typeorm';
import { Skill } from '../../modules/skills/entities/skill.entity';

export async function seedSkills(dataSource: DataSource): Promise<void> {
  const skillRepository = dataSource.getRepository(Skill);

  const skills = [
    // Programming Languages
    { name: 'JavaScript', icon: '🟨' },
    { name: 'TypeScript', icon: '🔷' },
    { name: 'Python', icon: '🐍' },
    { name: 'Java', icon: '☕' },
    { name: 'C++', icon: '⚡' },
    { name: 'Go', icon: '🔵' },
    { name: 'Rust', icon: '🦀' },
    { name: 'PHP', icon: '🐘' },
    { name: 'Ruby', icon: '💎' },
    { name: 'Swift', icon: '🍎' },
    { name: 'Kotlin', icon: '🤖' },
    { name: 'C#', icon: '🎯' },

    // Frontend
    { name: 'React', icon: '⚛️' },
    { name: 'Vue.js', icon: '💚' },
    { name: 'Angular', icon: '🔺' },
    { name: 'Next.js', icon: '▲' },
    { name: 'Svelte', icon: '🧡' },
    { name: 'HTML/CSS', icon: '🎨' },
    { name: 'Tailwind CSS', icon: '🌊' },
    { name: 'Material UI', icon: '📱' },

    // Backend
    { name: 'Node.js', icon: '💚' },
    { name: 'Express.js', icon: '🚂' },
    { name: 'NestJS', icon: '🦁' },
    { name: 'Django', icon: '🎸' },
    { name: 'Flask', icon: '🔬' },
    { name: 'Spring Boot', icon: '🍃' },
    { name: 'Laravel', icon: '🔴' },
    { name: 'ASP.NET', icon: '🟦' },

    // Databases
    { name: 'PostgreSQL', icon: '🐘' },
    { name: 'MySQL', icon: '🐬' },
    { name: 'MongoDB', icon: '🍃' },
    { name: 'Redis', icon: '🔴' },
    { name: 'SQLite', icon: '💾' },
    { name: 'Elasticsearch', icon: '🔍' },

    // DevOps & Tools
    { name: 'Docker', icon: '🐳' },
    { name: 'Kubernetes', icon: '☸️' },
    { name: 'AWS', icon: '☁️' },
    { name: 'Azure', icon: '🔷' },
    { name: 'GCP', icon: '🌩️' },
    { name: 'Git', icon: '📚' },
    { name: 'CI/CD', icon: '🔄' },
    { name: 'Linux', icon: '🐧' },

    // Mobile
    { name: 'React Native', icon: '📱' },
    { name: 'Flutter', icon: '💙' },
    { name: 'iOS Development', icon: '🍎' },
    { name: 'Android Development', icon: '🤖' },

    // Data Science & AI
    { name: 'Machine Learning', icon: '🤖' },
    { name: 'TensorFlow', icon: '🧠' },
    { name: 'PyTorch', icon: '🔥' },
    { name: 'Data Analysis', icon: '📊' },
    { name: 'pandas', icon: '🐼' },
    { name: 'NumPy', icon: '🔢' },

    // Design
    { name: 'Figma', icon: '🎨' },
    { name: 'Adobe XD', icon: '🖼️' },
    { name: 'UI Design', icon: '✨' },
    { name: 'UX Research', icon: '🔍' },

    // Others
    { name: 'GraphQL', icon: '◼️' },
    { name: 'REST API', icon: '🌐' },
    { name: 'WebSocket', icon: '🔌' },
    { name: 'Blockchain', icon: '⛓️' },
    { name: 'Solidity', icon: '💰' },
    { name: 'Testing', icon: '✅' },
    { name: 'Agile/Scrum', icon: '🏃' },
    { name: 'Technical Writing', icon: '📝' },
  ];

  for (const skillData of skills) {
    const existing = await skillRepository.findOne({
      where: { name: skillData.name },
    });

    if (!existing) {
      const skill = skillRepository.create(skillData);
      await skillRepository.save(skill);
      console.log(`✓ Created skill: ${skillData.name}`);
    } else {
      console.log(`- Skill already exists: ${skillData.name}`);
    }
  }
}
