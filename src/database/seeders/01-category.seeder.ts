import { DataSource } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';

export class CategorySeeder {
  async run(dataSource: DataSource): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);

    // Check if data already exists
    const count = await categoryRepository.count();
    if (count > 0) {
      console.log('✅ Categories already seeded, skipping...');
      return;
    }

    const categories = [
      {
        name: 'Web Development',
        description: 'Projects related to web application development',
        icon: '🌐',
      },
      {
        name: 'Mobile Development',
        description: 'Mobile application projects for iOS and Android',
        icon: '📱',
      },
      {
        name: 'Data Science',
        description: 'Data analysis, machine learning, and AI projects',
        icon: '📊',
      },
      {
        name: 'DevOps',
        description: 'Infrastructure, deployment, and automation projects',
        icon: '⚙️',
      },
      {
        name: 'UI/UX Design',
        description: 'User interface and experience design projects',
        icon: '🎨',
      },
      {
        name: 'Blockchain',
        description: 'Blockchain and cryptocurrency projects',
        icon: '⛓️',
      },
      {
        name: 'Game Development',
        description: 'Video game and interactive media projects',
        icon: '🎮',
      },
      {
        name: 'IoT',
        description: 'Internet of Things and embedded systems projects',
        icon: '🔌',
      },
      {
        name: 'Cybersecurity',
        description: 'Security, encryption, and protection projects',
        icon: '🔒',
      },
      {
        name: 'Education',
        description: 'Educational technology and e-learning projects',
        icon: '📚',
      },
      {
        name: 'Healthcare',
        description: 'Health technology and medical software projects',
        icon: '🏥',
      },
      {
        name: 'Social Impact',
        description: 'Projects with social and community impact',
        icon: '🌍',
      },
    ];

    await categoryRepository.save(categories);
    console.log(`✅ Seeded ${categories.length} categories`);
  }
}
