import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';
import { ProjectSkill } from '../../modules/projects/entities/project-skill.entity';

export const seedProjectSkills = async (
  dataSource: DataSource,
): Promise<void> => {
  const projectSkillRepository = dataSource.getRepository(ProjectSkill);
  const projectRepository = dataSource.getRepository(Project);
  const skillRepository = dataSource.getRepository(Skill);

  // Check if project skills already exist
  const existingCount = await projectSkillRepository.count();
  if (existingCount > 0) {
    console.log('Project skills already exist, skipping seed...');
    return;
  }

  const projects = await projectRepository.find();
  if (projects.length === 0) {
    console.log('⚠️  No projects found. Please run project seeder first.');
    return;
  }

  // Get all skills
  const react = await skillRepository.findOne({ where: { name: 'React' } });
  const nodejs = await skillRepository.findOne({ where: { name: 'Node.js' } });
  const typescript = await skillRepository.findOne({
    where: { name: 'TypeScript' },
  });
  const postgresql = await skillRepository.findOne({
    where: { name: 'PostgreSQL' },
  });
  const reactNative = await skillRepository.findOne({
    where: { name: 'React Native' },
  });
  const mongodb = await skillRepository.findOne({ where: { name: 'MongoDB' } });
  const python = await skillRepository.findOne({ where: { name: 'Python' } });
  const tensorflow = await skillRepository.findOne({
    where: { name: 'TensorFlow' },
  });
  const flutter = await skillRepository.findOne({ where: { name: 'Flutter' } });
  const nestjs = await skillRepository.findOne({ where: { name: 'NestJS' } });
  const nextjs = await skillRepository.findOne({ where: { name: 'Next.js' } });
  const tailwind = await skillRepository.findOne({
    where: { name: 'Tailwind CSS' },
  });
  const vue = await skillRepository.findOne({ where: { name: 'Vue.js' } });
  const laravel = await skillRepository.findOne({ where: { name: 'Laravel' } });
  const mysql = await skillRepository.findOne({ where: { name: 'MySQL' } });
  const websocket = await skillRepository.findOne({
    where: { name: 'WebSocket' },
  });
  const rest = await skillRepository.findOne({ where: { name: 'REST API' } });
  const graphql = await skillRepository.findOne({ where: { name: 'GraphQL' } });
  const docker = await skillRepository.findOne({ where: { name: 'Docker' } });
  const git = await skillRepository.findOne({ where: { name: 'Git' } });

  // Map projects to skills with mandatory flags
  const projectSkillMappings = [
    {
      projectName: 'EduConnect - Online Learning Platform',
      skills: [
        { skill: react, isMandatory: true },
        { skill: nodejs, isMandatory: true },
        { skill: typescript, isMandatory: true },
        { skill: postgresql, isMandatory: true },
        { skill: websocket, isMandatory: false },
        { skill: rest, isMandatory: false },
        { skill: docker, isMandatory: false },
        { skill: git, isMandatory: true },
      ],
    },
    {
      projectName: 'GreenCart - Sustainable Shopping App',
      skills: [
        { skill: reactNative, isMandatory: true },
        { skill: nodejs, isMandatory: true },
        { skill: mongodb, isMandatory: true },
        { skill: rest, isMandatory: true },
        { skill: typescript, isMandatory: false },
        { skill: docker, isMandatory: false },
        { skill: git, isMandatory: true },
      ],
    },
    {
      projectName: 'HealthTracker AI - Personal Health Assistant',
      skills: [
        { skill: python, isMandatory: true },
        { skill: tensorflow, isMandatory: true },
        { skill: flutter, isMandatory: true },
        { skill: postgresql, isMandatory: true },
        { skill: docker, isMandatory: false },
        { skill: rest, isMandatory: true },
        { skill: git, isMandatory: true },
      ],
    },
    {
      projectName: 'CodeCollab - Real-time Collaborative IDE',
      skills: [
        { skill: typescript, isMandatory: true },
        { skill: nodejs, isMandatory: true },
        { skill: websocket, isMandatory: true },
        { skill: react, isMandatory: true },
        { skill: docker, isMandatory: false },
        { skill: git, isMandatory: true },
      ],
    },
    {
      projectName: 'VolunteerHub - Community Service Platform',
      skills: [
        { skill: nextjs, isMandatory: true },
        { skill: nestjs, isMandatory: true },
        { skill: typescript, isMandatory: true },
        { skill: postgresql, isMandatory: true },
        { skill: tailwind, isMandatory: false },
        { skill: docker, isMandatory: false },
        { skill: git, isMandatory: true },
      ],
    },
    {
      projectName: 'SmartFinance - Personal Budget Manager',
      skills: [
        { skill: vue, isMandatory: true },
        { skill: laravel, isMandatory: true },
        { skill: mysql, isMandatory: true },
        { skill: rest, isMandatory: true },
        { skill: docker, isMandatory: false },
        { skill: git, isMandatory: true },
      ],
    },
  ];

  let totalCreated = 0;

  for (const mapping of projectSkillMappings) {
    const project = projects.find((p) => p.name === mapping.projectName);
    if (!project) continue;

    for (const { skill, isMandatory } of mapping.skills) {
      if (!skill) continue;

      const projectSkill = projectSkillRepository.create({
        project,
        skill,
        isMandatory,
      });

      await projectSkillRepository.save(projectSkill);
      totalCreated++;
    }
  }

  console.log(
    `✅ Successfully linked ${totalCreated} project-skill relationships`,
  );
};
