import { DataSource } from 'typeorm';
import { ProjectCategory } from '../../modules/projects/entities/project-category.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { Category } from '../../modules/categories/entities/category.entity';

export class ProjectCategorySeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectCategoryRepository =
      dataSource.getRepository(ProjectCategory);
    const projectRepository = dataSource.getRepository(Project);
    const categoryRepository = dataSource.getRepository(Category);

    // Check if data already exists
    const count = await projectCategoryRepository.count();
    if (count > 0) {
      console.log('✅ Project categories already seeded, skipping...');
      return;
    }

    // Get projects and categories
    const projects = await projectRepository.find();
    const categories = await categoryRepository.find();

    if (projects.length === 0 || categories.length === 0) {
      console.log(
        '⚠️ No projects or categories found, skipping project categories seeding',
      );
      return;
    }

    // Helper function to get random categories
    const getRandomCategories = (count: number) => {
      const shuffled = [...categories].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const projectCategories: Array<{
      projectId: string;
      categoryId: string;
    }> = [];

    // Assign categories to each project (1-3 categories per project)
    for (const project of projects) {
      const categoryCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 categories
      const selectedCategories = getRandomCategories(categoryCount);

      for (const category of selectedCategories) {
        projectCategories.push({
          projectId: project.id,
          categoryId: category.id,
        });
      }
    }

    await projectCategoryRepository.save(projectCategories);
    console.log(`✅ Seeded ${projectCategories.length} project categories`);
  }
}
