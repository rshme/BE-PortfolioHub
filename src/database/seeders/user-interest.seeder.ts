import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { UserInterest } from '../../modules/users/entities/user-interest.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export async function seedUserInterests(
  dataSource: DataSource,
): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const userInterestRepository = dataSource.getRepository(UserInterest);

  console.log('🎯 Seeding user interests...');

  try {
    // Get all mentors and volunteers
    const mentors = await userRepository.find({
      where: { role: UserRole.MENTOR },
    });

    const volunteers = await userRepository.find({
      where: { role: UserRole.VOLUNTEER },
    });

    // Get all categories
    const categories = await categoryRepository.find();

    if (categories.length === 0) {
      console.log('⚠️  No categories found. Skipping user interests seeding.');
      return;
    }

    const userInterests: Partial<UserInterest>[] = [];

    // Assign random interests to mentors (2-4 categories each)
    for (const mentor of mentors) {
      const numberOfInterests = Math.floor(Math.random() * 3) + 2; // 2-4 interests
      const shuffledCategories = [...categories].sort(
        () => Math.random() - 0.5,
      );
      const selectedCategories = shuffledCategories.slice(
        0,
        numberOfInterests,
      );

      for (const category of selectedCategories) {
        userInterests.push({
          userId: mentor.id,
          categoryId: category.id,
        });
      }
    }

    // Assign random interests to volunteers (3-5 categories each)
    for (const volunteer of volunteers) {
      const numberOfInterests = Math.floor(Math.random() * 5) + 3; // 1-3 interests
      const shuffledCategories = [...categories].sort(
        () => Math.random() - 0.5,
      );
      const selectedCategories = shuffledCategories.slice(
        0,
        numberOfInterests,
      );

      for (const category of selectedCategories) {
        userInterests.push({
          userId: volunteer.id,
          categoryId: category.id,
        });
      }
    }

    // Save all user interests
    await userInterestRepository.save(userInterests);

    console.log(
      `✅ Successfully seeded ${userInterests.length} user interests for ${mentors.length} mentors and ${volunteers.length} volunteers`,
    );
  } catch (error) {
    console.error('❌ Error seeding user interests:', error);
    throw error;
  }
}
