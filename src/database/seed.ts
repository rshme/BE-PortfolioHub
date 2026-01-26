import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';
import { UserSeeder } from './seeders/user.seeder';
import { seedCategories } from './seeders/category.seeder';
import { seedSkills } from './seeders/skill.seeder';
import { seedBadges } from './seeders/badge.seeder';
import { seedUserSkills } from './seeders/user-skill.seeder';
import { seedUserBadges } from './seeders/user-badge.seeder';
import { seedProjects } from './seeders/project.seeder';
import { seedProjectCategories } from './seeders/project-category.seeder';
import { seedProjectSkills } from './seeders/project-skill.seeder';
import { seedProjectMentors } from './seeders/project-mentor.seeder';
import { seedProjectVolunteers } from './seeders/project-volunteer.seeder';
import { seedMilestones } from './seeders/milestone.seeder';
import { seedTasks } from './seeders/task-v2.seeder';

const runSeeders = async () => {
  console.log('🌱 Starting database seeding...\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run Category Seeder
    console.log('📂 Running Category Seeder...');
    await seedCategories(dataSource);
    console.log('');

    // Run Skill Seeder
    console.log('🎯 Running Skill Seeder...');
    await seedSkills(dataSource);
    console.log('');

    // Run Badge Seeder
    console.log('🏅 Running Badge Seeder...');
    await seedBadges(dataSource);
    console.log('');

    // Run User Seeder
    console.log('👥 Running User Seeder...');
    const userSeeder = new UserSeeder();
    await userSeeder.run(dataSource);
    console.log('');

    // Run User Skills Seeder
    console.log('🎯 Running User Skills Seeder...');
    await seedUserSkills(dataSource);
    console.log('');

    // Run User Badges Seeder
    console.log('🏅 Running User Badges Seeder...');
    await seedUserBadges(dataSource);
    console.log('');

    // Run Project Seeder
    console.log('📊 Running Project Seeder...');
    await seedProjects(dataSource);
    console.log('');

    // Run Project Category Seeder
    console.log('🔗 Running Project Category Seeder...');
    await seedProjectCategories(dataSource);
    console.log('');

    // Run Project Skill Seeder
    console.log('⚡ Running Project Skill Seeder...');
    await seedProjectSkills(dataSource);
    console.log('');

    // Run Project Mentor Seeder
    console.log('🎓 Running Project Mentor Seeder...');
    await seedProjectMentors(dataSource);
    console.log('');

    // Run Project Volunteer Seeder
    console.log('🙋 Running Project Volunteer Seeder...');
    await seedProjectVolunteers(dataSource);
    console.log('');

    // Run Milestone Seeder
    console.log('🎯 Running Milestone Seeder...');
    await seedMilestones(dataSource);
    console.log('');

    // Run Task Seeder
    console.log('✅ Running Task Seeder...');
    await seedTasks(dataSource);

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runSeeders();
