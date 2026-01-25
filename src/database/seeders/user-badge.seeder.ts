import { DataSource } from 'typeorm';
import { UserBadge } from '../../modules/users/entities/user-badge.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Badge } from '../../modules/badges/entities/badge.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export async function seedUserBadges(dataSource: DataSource): Promise<void> {
  const userBadgeRepository = dataSource.getRepository(UserBadge);
  const userRepository = dataSource.getRepository(User);
  const badgeRepository = dataSource.getRepository(Badge);

  // Check if user badges already exist
  const existingUserBadges = await userBadgeRepository.count();
  if (existingUserBadges > 0) {
    console.log('User badges already exist, skipping seed...');
    return;
  }

  // Get all users
  const users = await userRepository.find();
  if (users.length === 0) {
    console.log('⚠️  No users found. Please run user seeder first.');
    return;
  }

  // Get all badges
  const badges = await badgeRepository.find();
  if (badges.length === 0) {
    console.log('⚠️  No badges found. Please run badge seeder first.');
    return;
  }

  // Create badge map for easy lookup
  const badgeMap = new Map(badges.map((badge) => [badge.name, badge]));

  // Get admin user for awarding badges
  const adminUser = users.find((u) => u.role === UserRole.ADMIN);

  // Define user badge assignments
  const userBadges: Partial<UserBadge>[] = [];

  // Award "Early Bird" to all users (registered early)
  const earlyBirdBadge = badgeMap.get('Early Bird');
  if (earlyBirdBadge) {
    for (const user of users) {
      userBadges.push({
        userId: user.id,
        badgeId: earlyBirdBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Registered during platform launch period',
      });
    }
  }

  // Award "Team Player" to volunteers
  const teamPlayerBadge = badgeMap.get('Team Player');
  if (teamPlayerBadge) {
    const volunteers = users.filter((u) => u.role === UserRole.VOLUNTEER);
    for (const volunteer of volunteers) {
      userBadges.push({
        userId: volunteer.id,
        badgeId: teamPlayerBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Joined first project as volunteer',
      });
    }
  }

  // Award "First Steps" to active volunteers
  const firstStepsBadge = badgeMap.get('First Steps');
  if (firstStepsBadge) {
    const activeVolunteers = users.filter(
      (u) =>
        u.role === UserRole.VOLUNTEER &&
        ['alicevolunteer', 'bobdev', 'charliebackend'].includes(u.username),
    );
    for (const volunteer of activeVolunteers) {
      userBadges.push({
        userId: volunteer.id,
        badgeId: firstStepsBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Completed first task',
      });
    }
  }

  // Award "Quick Learner" to users with many skills
  const quickLearnerBadge = badgeMap.get('Quick Learner');
  if (quickLearnerBadge) {
    const skilledUsers = users.filter((u) =>
      ['admin', 'johnmentor', 'alicevolunteer'].includes(u.username),
    );
    for (const user of skilledUsers) {
      userBadges.push({
        userId: user.id,
        badgeId: quickLearnerBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Added 10+ skills to profile',
      });
    }
  }

  // Award "Collaborator" to mentors
  const collaboratorBadge = badgeMap.get('Collaborator');
  if (collaboratorBadge) {
    const mentors = users.filter((u) => u.role === UserRole.MENTOR);
    for (const mentor of mentors) {
      userBadges.push({
        userId: mentor.id,
        badgeId: collaboratorBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Joined 5 different projects',
      });
    }
  }

  // Award "Task Master" to senior volunteers
  const taskMasterBadge = badgeMap.get('Task Master');
  if (taskMasterBadge) {
    const seniorVolunteers = users.filter((u) =>
      ['alicevolunteer', 'charliebackend'].includes(u.username),
    );
    for (const volunteer of seniorVolunteers) {
      userBadges.push({
        userId: volunteer.id,
        badgeId: taskMasterBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Completed 10 tasks',
      });
    }
  }

  // Award "Code Warrior" to experienced developers
  const codeWarriorBadge = badgeMap.get('Code Warrior');
  if (codeWarriorBadge) {
    const experiencedDevs = users.filter((u) =>
      ['johnmentor', 'alicevolunteer'].includes(u.username),
    );
    for (const dev of experiencedDevs) {
      userBadges.push({
        userId: dev.id,
        badgeId: codeWarriorBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Completed 50 tasks',
      });
    }
  }

  // Award "Mentor" badge to mentors
  const mentorBadge = badgeMap.get('Mentor');
  if (mentorBadge) {
    const mentors = users.filter((u) => u.role === UserRole.MENTOR);
    for (const mentor of mentors) {
      userBadges.push({
        userId: mentor.id,
        badgeId: mentorBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Mentored 5 projects',
      });
    }
  }

  // Award "Project Leader" to project owners
  const projectLeaderBadge = badgeMap.get('Project Leader');
  if (projectLeaderBadge) {
    const owners = users.filter((u) => u.role === UserRole.PROJECT_OWNER);
    for (const owner of owners) {
      userBadges.push({
        userId: owner.id,
        badgeId: projectLeaderBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Successfully led 3 projects',
      });
    }
  }

  // Award "Innovation Champion" to admin and experienced users
  const innovationBadge = badgeMap.get('Innovation Champion');
  if (innovationBadge) {
    const innovators = users.filter((u) =>
      ['admin', 'johnmentor', 'gracefounder'].includes(u.username),
    );
    for (const innovator of innovators) {
      userBadges.push({
        userId: innovator.id,
        badgeId: innovationBadge.id,
        awardedBy: adminUser?.id,
        reason: 'Created innovative solution',
      });
    }
  }

  // Award "Legendary Contributor" to admin only
  const legendaryBadge = badgeMap.get('Legendary Contributor');
  if (legendaryBadge && adminUser) {
    userBadges.push({
      userId: adminUser.id,
      badgeId: legendaryBadge.id,
      reason: 'Outstanding contribution to platform',
    });
  }

  // Save user badges
  if (userBadges.length > 0) {
    await userBadgeRepository.save(userBadges);
    console.log(`✅ Seeded ${userBadges.length} user badges successfully!`);

    // Show summary
    console.log('\n🏅 User Badges Summary:');
    for (const user of users) {
      const userBadgeCount = userBadges.filter(
        (ub) => ub.userId === user.id,
      ).length;
      if (userBadgeCount > 0) {
        console.log(
          `   - ${user.fullName} (${user.username}): ${userBadgeCount} badges`,
        );
      }
    }
  } else {
    console.log('⚠️  No user badges to seed.');
  }
}
