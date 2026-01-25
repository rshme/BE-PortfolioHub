import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { ProjectCategory } from '../../modules/projects/entities/project-category.entity';

export const seedProjectCategories = async (
  dataSource: DataSource,
): Promise<void> => {
  const projectCategoryRepository = dataSource.getRepository(ProjectCategory);
  const projectRepository = dataSource.getRepository(Project);
  const categoryRepository = dataSource.getRepository(Category);

  // Check if project categories already exist
  const existingCount = await projectCategoryRepository.count();
  if (existingCount > 0) {
    console.log('Project categories already exist, skipping seed...');
    return;
  }

  const projects = await projectRepository.find();
  if (projects.length === 0) {
    console.log('⚠️  No projects found. Please run project seeder first.');
    return;
  }

  // Get all categories
  const webDev = await categoryRepository.findOne({
    where: { name: 'Web Development' },
  });
  const mobileDev = await categoryRepository.findOne({
    where: { name: 'Mobile Development' },
  });
  const dataScience = await categoryRepository.findOne({
    where: { name: 'Data Science' },
  });
  const openSource = await categoryRepository.findOne({
    where: { name: 'Open Source' },
  });
  const socialImpact = await categoryRepository.findOne({
    where: { name: 'Social Impact' },
  });
  const education = await categoryRepository.findOne({
    where: { name: 'Education' },
  });

  // Map projects to categories
  const projectCategoryMappings = [
    // EduConnect
    {
      projectName: 'EduConnect - Online Learning Platform',
      categories: [webDev, education, socialImpact],
    },
    // GreenCart
    {
      projectName: 'GreenCart - Sustainable Shopping App',
      categories: [mobileDev, socialImpact],
    },
    // HealthTracker AI
    {
      projectName: 'HealthTracker AI - Personal Health Assistant',
      categories: [mobileDev, dataScience, socialImpact],
    },
    // CodeCollab
    {
      projectName: 'CodeCollab - Real-time Collaborative IDE',
      categories: [webDev, openSource],
    },
    // VolunteerHub
    {
      projectName: 'VolunteerHub - Community Service Platform',
      categories: [webDev, socialImpact],
    },
    // SmartFinance
    {
      projectName: 'SmartFinance - Personal Budget Manager',
      categories: [webDev, mobileDev],
    },
  ];

  let totalCreated = 0;

  for (const mapping of projectCategoryMappings) {
    const project = projects.find((p) => p.name === mapping.projectName);
    if (!project) continue;

    for (const category of mapping.categories) {
      if (!category) continue;

      const projectCategory = projectCategoryRepository.create({
        project,
        category,
      });

      await projectCategoryRepository.save(projectCategory);
      totalCreated++;
    }
  }

  console.log(
    `✅ Successfully linked ${totalCreated} project-category relationships`,
  );
};
