import { DataSource } from 'typeorm';
import { Badge } from '../../modules/badges/entities/badge.entity';
import { BadgeRarity } from '../../common/enums/badge-rarity.enum';

export class BadgeSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const badgeRepository = dataSource.getRepository(Badge);

    // Check if data already exists
    const count = await badgeRepository.count();
    if (count > 0) {
      console.log('✅ Badges already seeded, skipping...');
      return;
    }

    const badges = [
      {
        name: 'First Steps',
        description: 'Completed your first project',
        iconUrl: '🎯',
        rarity: BadgeRarity.COMMON,
        criteria: {
          type: 'project_completion',
          count: 1,
        },
      },
      {
        name: 'Team Player',
        description: 'Joined 5 projects as a volunteer',
        iconUrl: '🤝',
        rarity: BadgeRarity.COMMON,
        criteria: {
          type: 'volunteer_count',
          count: 5,
        },
      },
      {
        name: 'Mentor',
        description: 'Mentored 3 projects',
        iconUrl: '👨‍🏫',
        rarity: BadgeRarity.UNCOMMON,
        criteria: {
          type: 'mentor_count',
          count: 3,
        },
      },
      {
        name: 'Early Bird',
        description: 'Joined the platform in its first month',
        iconUrl: '🐦',
        rarity: BadgeRarity.RARE,
        criteria: {
          type: 'early_adopter',
          before_date: '2025-01-01',
        },
      },
      {
        name: 'Perfectionist',
        description: 'Completed 10 projects with 100% task completion',
        iconUrl: '💯',
        rarity: BadgeRarity.EPIC,
        criteria: {
          type: 'perfect_completion',
          count: 10,
        },
      },
      {
        name: 'Code Master',
        description: 'Contributed to 20 projects',
        iconUrl: '👑',
        rarity: BadgeRarity.LEGENDARY,
        criteria: {
          type: 'project_contribution',
          count: 20,
        },
      },
      {
        name: 'Quick Learner',
        description: 'Completed a project in less than a week',
        iconUrl: '⚡',
        rarity: BadgeRarity.UNCOMMON,
        criteria: {
          type: 'quick_completion',
          days: 7,
        },
      },
      {
        name: 'Marathon Runner',
        description: 'Worked on a project for over 6 months',
        iconUrl: '🏃',
        rarity: BadgeRarity.RARE,
        criteria: {
          type: 'long_term_project',
          months: 6,
        },
      },
      {
        name: 'Bug Hunter',
        description: 'Fixed 50 bugs',
        iconUrl: '🐛',
        rarity: BadgeRarity.UNCOMMON,
        criteria: {
          type: 'bug_fixes',
          count: 50,
        },
      },
      {
        name: 'Innovator',
        description: 'Created 5 innovative projects',
        iconUrl: '💡',
        rarity: BadgeRarity.EPIC,
        criteria: {
          type: 'project_creation',
          count: 5,
        },
      },
      {
        name: 'Community Hero',
        description: 'Helped 100 community members',
        iconUrl: '🦸',
        rarity: BadgeRarity.LEGENDARY,
        criteria: {
          type: 'community_help',
          count: 100,
        },
      },
      {
        name: 'Consistent Contributor',
        description: 'Made contributions for 30 consecutive days',
        iconUrl: '📅',
        rarity: BadgeRarity.RARE,
        criteria: {
          type: 'consecutive_days',
          days: 30,
        },
      },
    ];

    await badgeRepository.save(badges);
    console.log(`✅ Seeded ${badges.length} badges`);
  }
}
