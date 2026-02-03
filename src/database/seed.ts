import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';

// Import all seeders
import { CategorySeeder } from './seeders/01-category.seeder';
import { SkillSeeder } from './seeders/02-skill.seeder';
import { BadgeSeeder } from './seeders/03-badge.seeder';
import { OrganizationSeeder } from './seeders/04-organization.seeder';
import { UserSeeder } from './seeders/05-user.seeder';
import { UserSkillSeeder } from './seeders/06-user-skill.seeder';
import { UserBadgeSeeder } from './seeders/07-user-badge.seeder';
import { UserInterestSeeder } from './seeders/08-user-interest.seeder';
import { ProjectSeeder } from './seeders/09-project.seeder';
import { ProjectCategorySeeder } from './seeders/10-project-category.seeder';
import { ProjectSkillSeeder } from './seeders/11-project-skill.seeder';
import { ProjectMentorSeeder } from './seeders/12-project-mentor.seeder';
import { ProjectVolunteerSeeder } from './seeders/13-project-volunteer.seeder';
import { TestimonialSeeder } from './seeders/14-testimonial.seeder';
import { MilestoneSeeder } from './seeders/15-milestone.seeder';
import { TaskSeeder } from './seeders/16-task.seeder';
import { TaskCommentSeeder } from './seeders/17-task-comment.seeder';

const runSeeders = async () => {
  console.log('🌱 Starting database seeding...\n');
  console.log('═'.repeat(60));

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');
    console.log('═'.repeat(60));

    // Stage 1: Reference Tables (No dependencies)
    console.log('\n📦 STAGE 1: Reference Tables\n');
    
    console.log('📂 [1/3] Seeding Categories...');
    const categorySeeder = new CategorySeeder();
    await categorySeeder.run(dataSource);
    
    console.log('🎯 [2/3] Seeding Skills...');
    const skillSeeder = new SkillSeeder();
    await skillSeeder.run(dataSource);
    
    console.log('🏅 [3/3] Seeding Badges...');
    const badgeSeeder = new BadgeSeeder();
    await badgeSeeder.run(dataSource);

    // Stage 2: Organizations and Users
    console.log('\n═'.repeat(60));
    console.log('👥 STAGE 2: Organizations & Users\n');
    
    console.log('🏢 [1/2] Seeding Organizations...');
    const organizationSeeder = new OrganizationSeeder();
    await organizationSeeder.run(dataSource);
    
    console.log('👤 [2/2] Seeding Users...');
    const userSeeder = new UserSeeder();
    await userSeeder.run(dataSource);

    // Stage 3: User Relations
    console.log('\n═'.repeat(60));
    console.log('🔗 STAGE 3: User Relations\n');
    
    console.log('⚡ [1/3] Seeding User Skills...');
    const userSkillSeeder = new UserSkillSeeder();
    await userSkillSeeder.run(dataSource);
    
    console.log('🎖️  [2/3] Seeding User Badges...');
    const userBadgeSeeder = new UserBadgeSeeder();
    await userBadgeSeeder.run(dataSource);
    
    console.log('💡 [3/3] Seeding User Interests...');
    const userInterestSeeder = new UserInterestSeeder();
    await userInterestSeeder.run(dataSource);

    // Stage 4: Projects
    console.log('\n═'.repeat(60));
    console.log('📊 STAGE 4: Projects\n');
    
    console.log('🚀 [1/1] Seeding Projects...');
    const projectSeeder = new ProjectSeeder();
    await projectSeeder.run(dataSource);

    // Stage 5: Project Relations
    console.log('\n═'.repeat(60));
    console.log('🔗 STAGE 5: Project Relations\n');
    
    console.log('📁 [1/4] Seeding Project Categories...');
    const projectCategorySeeder = new ProjectCategorySeeder();
    await projectCategorySeeder.run(dataSource);
    
    console.log('⚙️  [2/4] Seeding Project Skills...');
    const projectSkillSeeder = new ProjectSkillSeeder();
    await projectSkillSeeder.run(dataSource);
    
    console.log('🎓 [3/4] Seeding Project Mentors...');
    const projectMentorSeeder = new ProjectMentorSeeder();
    await projectMentorSeeder.run(dataSource);
    
    console.log('🙋 [4/4] Seeding Project Volunteers...');
    const projectVolunteerSeeder = new ProjectVolunteerSeeder();
    await projectVolunteerSeeder.run(dataSource);

    // Stage 6: Testimonials
    console.log('\n═'.repeat(60));
    console.log('💬 STAGE 6: Testimonials\n');
    
    console.log('⭐ [1/1] Seeding Testimonials...');
    const testimonialSeeder = new TestimonialSeeder();
    await testimonialSeeder.run(dataSource);

    // Stage 7: Milestones and Tasks
    console.log('\n═'.repeat(60));
    console.log('📋 STAGE 7: Milestones & Tasks\n');
    
    console.log('🎯 [1/2] Seeding Milestones...');
    const milestoneSeeder = new MilestoneSeeder();
    await milestoneSeeder.run(dataSource);
    
    console.log('✅ [2/2] Seeding Tasks...');
    const taskSeeder = new TaskSeeder();
    await taskSeeder.run(dataSource);

    // Stage 8: Task Comments
    console.log('\n═'.repeat(60));
    console.log('💭 STAGE 8: Task Comments\n');
    
    console.log('💬 [1/1] Seeding Task Comments...');
    const taskCommentSeeder = new TaskCommentSeeder();
    await taskCommentSeeder.run(dataSource);

    console.log('\n═'.repeat(60));
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('\n═'.repeat(60));
    console.error('❌ Error during seeding:', error);
    console.error('═'.repeat(60));
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
};

runSeeders();
