import { DataSource } from 'typeorm';
import { Category } from '../../modules/categories/entities/category.entity';

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(Category);

  const categories = [
    {
      name: 'Web Development',
      description: 'Projects related to web application development',
      icon: '🌐',
    },
    {
      name: 'Mobile Development',
      description: 'Projects for iOS, Android, or cross-platform mobile apps',
      icon: '📱',
    },
    {
      name: 'Data Science',
      description: 'Projects involving data analysis, machine learning, and AI',
      icon: '📊',
    },
    {
      name: 'DevOps',
      description: 'Infrastructure, CI/CD, and deployment automation projects',
      icon: '⚙️',
    },
    {
      name: 'UI/UX Design',
      description: 'User interface and experience design projects',
      icon: '🎨',
    },
    {
      name: 'Game Development',
      description: 'Video game and interactive entertainment projects',
      icon: '🎮',
    },
    {
      name: 'Blockchain',
      description: 'Cryptocurrency, smart contracts, and decentralized apps',
      icon: '⛓️',
    },
    {
      name: 'IoT',
      description: 'Internet of Things and embedded systems projects',
      icon: '🔌',
    },
    {
      name: 'Cybersecurity',
      description: 'Security, penetration testing, and ethical hacking',
      icon: '🔒',
    },
    {
      name: 'Open Source',
      description: 'Contributing to open source projects',
      icon: '💻',
    },
    {
      name: 'Social Impact',
      description: 'Projects that create positive social change',
      icon: '🌍',
    },
    {
      name: 'Education',
      description: 'E-learning platforms and educational tools',
      icon: '📚',
    },
  ];

  for (const categoryData of categories) {
    const existing = await categoryRepository.findOne({
      where: { name: categoryData.name },
    });

    if (!existing) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`✓ Created category: ${categoryData.name}`);
    } else {
      console.log(`- Category already exists: ${categoryData.name}`);
    }
  }
}
