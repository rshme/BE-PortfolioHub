import { DataSource } from 'typeorm';
import { Badge } from '../../modules/badges/entities/badge.entity';
import { BadgeRarity } from '../../common/enums/badge-rarity.enum';

export async function seedBadges(dataSource: DataSource): Promise<void> {
  const badgeRepository = dataSource.getRepository(Badge);

  const badges = [
    // Common Badges
    {
      name: 'First Steps',
      description: 'Completed your first task',
      iconUrl: '🎯',
      rarity: BadgeRarity.COMMON,
      criteria: { tasks_completed: 1 },
    },
    {
      name: 'Team Player',
      description: 'Joined your first project',
      iconUrl: '👥',
      rarity: BadgeRarity.COMMON,
      criteria: { projects_joined: 1 },
    },
    {
      name: 'Early Bird',
      description: 'Registered in the first month',
      iconUrl: '🐦',
      rarity: BadgeRarity.COMMON,
      criteria: { registration_period: 'early' },
    },

    // Uncommon Badges
    {
      name: 'Task Master',
      description: 'Completed 10 tasks',
      iconUrl: '✅',
      rarity: BadgeRarity.UNCOMMON,
      criteria: { tasks_completed: 10 },
    },
    {
      name: 'Collaborator',
      description: 'Joined 5 different projects',
      iconUrl: '🤝',
      rarity: BadgeRarity.UNCOMMON,
      criteria: { projects_joined: 5 },
    },
    {
      name: 'Quick Learner',
      description: 'Added 10 skills to your profile',
      iconUrl: '📚',
      rarity: BadgeRarity.UNCOMMON,
      criteria: { skills_added: 10 },
    },
    {
      name: 'Helpful Hand',
      description: 'Mentored on 3 projects',
      iconUrl: '🎓',
      rarity: BadgeRarity.UNCOMMON,
      criteria: { mentoring_projects: 3 },
    },

    // Rare Badges
    {
      name: 'Project Leader',
      description: 'Successfully completed a project as owner',
      iconUrl: '👑',
      rarity: BadgeRarity.RARE,
      criteria: { completed_projects_as_owner: 1 },
    },
    {
      name: 'Dedicated Worker',
      description: 'Completed 50 tasks',
      iconUrl: '💪',
      rarity: BadgeRarity.RARE,
      criteria: { tasks_completed: 50 },
    },
    {
      name: 'Super Mentor',
      description: 'Mentored on 10 projects',
      iconUrl: '🌟',
      rarity: BadgeRarity.RARE,
      criteria: { mentoring_projects: 10 },
    },
    {
      name: 'Code Review Expert',
      description: 'Provided 100 helpful comments',
      iconUrl: '💬',
      rarity: BadgeRarity.RARE,
      criteria: { comments_count: 100 },
    },

    // Epic Badges
    {
      name: 'Portfolio Champion',
      description: 'Completed 5 projects as team member',
      iconUrl: '🏆',
      rarity: BadgeRarity.EPIC,
      criteria: { completed_projects: 5 },
    },
    {
      name: 'Task Crusher',
      description: 'Completed 100 tasks',
      iconUrl: '💥',
      rarity: BadgeRarity.EPIC,
      criteria: { tasks_completed: 100 },
    },
    {
      name: 'Community Leader',
      description: 'Created 10 successful projects',
      iconUrl: '🎖️',
      rarity: BadgeRarity.EPIC,
      criteria: { created_projects: 10 },
    },
    {
      name: 'Skill Master',
      description: 'Proficient in 20+ skills',
      iconUrl: '🎯',
      rarity: BadgeRarity.EPIC,
      criteria: { skills_count: 20 },
    },

    // Legendary Badges
    {
      name: 'Legend',
      description: 'Completed 500 tasks',
      iconUrl: '⭐',
      rarity: BadgeRarity.LEGENDARY,
      criteria: { tasks_completed: 500 },
    },
    {
      name: 'Platform Pioneer',
      description: 'One of the first 100 users',
      iconUrl: '🚀',
      rarity: BadgeRarity.LEGENDARY,
      criteria: { user_id_range: 100 },
    },
    {
      name: 'Grand Master',
      description: 'Completed 25+ projects',
      iconUrl: '👑',
      rarity: BadgeRarity.LEGENDARY,
      criteria: { completed_projects: 25 },
    },
    {
      name: 'Eternal Mentor',
      description: 'Mentored on 50+ projects',
      iconUrl: '🧙',
      rarity: BadgeRarity.LEGENDARY,
      criteria: { mentoring_projects: 50 },
    },
  ];

  for (const badgeData of badges) {
    const existing = await badgeRepository.findOne({
      where: { name: badgeData.name },
    });

    if (!existing) {
      const badge = badgeRepository.create(badgeData);
      await badgeRepository.save(badge);
      console.log(`✓ Created badge: ${badgeData.name} (${badgeData.rarity})`);
    } else {
      console.log(`- Badge already exists: ${badgeData.name}`);
    }
  }
}
