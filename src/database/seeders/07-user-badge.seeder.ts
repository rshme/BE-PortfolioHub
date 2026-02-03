import { DataSource } from 'typeorm';
import { UserBadge } from '../../modules/users/entities/user-badge.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Badge } from '../../modules/badges/entities/badge.entity';

export class UserBadgeSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userBadgeRepository = dataSource.getRepository(UserBadge);
    const userRepository = dataSource.getRepository(User);
    const badgeRepository = dataSource.getRepository(Badge);

    // Check if data already exists
    const count = await userBadgeRepository.count();
    if (count > 0) {
      console.log('✅ User badges already seeded, skipping...');
      return;
    }

    // Get users and badges
    const users = await userRepository.find();
    const badges = await badgeRepository.find();

    if (users.length === 0 || badges.length === 0) {
      console.log('⚠️ No users or badges found, skipping user badges seeding');
      return;
    }

    // Get admin user for awarding badges
    const adminUser = users.find((u) => u.email === 'admin@portfoliohub.com');

    // Helper function to get random badges
    const getRandomBadges = (count: number) => {
      const shuffled = [...badges].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const userBadges: Array<{
      userId: string;
      badgeId: string;
      awardedBy: string | undefined;
      reason: string;
    }> = [];

    // Assign badges to each user (0-5 badges per user)
    for (const user of users) {
      // Skip admin
      if (user.email === 'admin@portfoliohub.com') continue;

      const badgeCount = Math.floor(Math.random() * 6); // 0 to 5 badges
      if (badgeCount === 0) continue;

      const selectedBadges = getRandomBadges(badgeCount);

      for (const badge of selectedBadges) {
        userBadges.push({
          userId: user.id,
          badgeId: badge.id,
          awardedBy: adminUser?.id,
          reason: `Awarded for outstanding achievement in ${badge.name}`,
        });
      }
    }

    if (userBadges.length > 0) {
      await userBadgeRepository.save(userBadges);
      console.log(`✅ Seeded ${userBadges.length} user badges`);
    } else {
      console.log('✅ No user badges to seed');
    }
  }
}
