import { DataSource } from 'typeorm';
import { UserInterest } from '../../modules/users/entities/user-interest.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';

export class UserInterestSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userInterestRepository = dataSource.getRepository(UserInterest);
    const userRepository = dataSource.getRepository(User);
    const categoryRepository = dataSource.getRepository(Category);

    // Check if data already exists
    const count = await userInterestRepository.count();
    if (count > 0) {
      console.log('✅ User interests already seeded, skipping...');
      return;
    }

    // Get users and categories
    const users = await userRepository.find();
    const categories = await categoryRepository.find();

    if (users.length === 0 || categories.length === 0) {
      console.log(
        '⚠️ No users or categories found, skipping user interests seeding',
      );
      return;
    }

    // Helper function to get random categories
    const getRandomCategories = (count: number) => {
      const shuffled = [...categories].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const userInterests: Array<{ userId: string; categoryId: string }> = [];

    // Assign interests to each user (2-5 interests per user)
    for (const user of users) {
      const interestCount = Math.floor(Math.random() * 4) + 2; // 2 to 5 interests
      const selectedCategories = getRandomCategories(interestCount);

      for (const category of selectedCategories) {
        userInterests.push({
          userId: user.id,
          categoryId: category.id,
        });
      }
    }

    await userInterestRepository.save(userInterests);
    console.log(`✅ Seeded ${userInterests.length} user interests`);
  }
}
