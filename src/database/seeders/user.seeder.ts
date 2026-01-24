import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

export class UserSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed...');
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'admin@portfoliohub.com',
        username: 'admin',
        password: hashedPassword,
        fullName: 'Admin User',
        role: UserRole.ADMIN,
        bio: 'System Administrator',
        socialLinks: {
          github: 'https://github.com/admin',
          linkedin: 'https://linkedin.com/in/admin',
        },
      },
      {
        email: 'mentor@portfoliohub.com',
        username: 'johnmentor',
        password: hashedPassword,
        fullName: 'John Mentor',
        role: UserRole.MENTOR,
        bio: 'Senior Software Engineer with 10+ years experience',
        socialLinks: {
          github: 'https://github.com/johnmentor',
          linkedin: 'https://linkedin.com/in/johnmentor',
          twitter: 'https://twitter.com/johnmentor',
        },
      },
      {
        email: 'volunteer1@portfoliohub.com',
        username: 'alicevolunteer',
        password: hashedPassword,
        fullName: 'Alice Volunteer',
        role: UserRole.VOLUNTEER,
        bio: 'Full-stack developer passionate about open source',
        socialLinks: {
          github: 'https://github.com/alicevolunteer',
          linkedin: 'https://linkedin.com/in/alicevolunteer',
        },
      },
      {
        email: 'volunteer2@portfoliohub.com',
        username: 'bobdev',
        password: hashedPassword,
        fullName: 'Bob Developer',
        role: UserRole.VOLUNTEER,
        bio: 'Frontend developer specializing in React and Vue',
        socialLinks: {
          github: 'https://github.com/bobdev',
        },
      },
      {
        email: 'owner@portfoliohub.com',
        username: 'sarahowner',
        password: hashedPassword,
        fullName: 'Sarah Project Owner',
        role: UserRole.PROJECT_OWNER,
        bio: 'Product manager and entrepreneur',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/sarahowner',
          twitter: 'https://twitter.com/sarahowner',
        },
      },
      {
        email: 'volunteer3@portfoliohub.com',
        username: 'charliebackend',
        password: hashedPassword,
        fullName: 'Charlie Backend',
        role: UserRole.VOLUNTEER,
        bio: 'Backend engineer focused on Node.js and Python',
        socialLinks: {
          github: 'https://github.com/charliebackend',
          linkedin: 'https://linkedin.com/in/charliebackend',
        },
      },
      {
        email: 'mentor2@portfoliohub.com',
        username: 'dianaexpert',
        password: hashedPassword,
        fullName: 'Diana Expert',
        role: UserRole.MENTOR,
        bio: 'UI/UX Designer and Frontend Architect',
        socialLinks: {
          github: 'https://github.com/dianaexpert',
          linkedin: 'https://linkedin.com/in/dianaexpert',
          twitter: 'https://twitter.com/dianaexpert',
        },
      },
      {
        email: 'volunteer4@portfoliohub.com',
        username: 'evamobile',
        password: hashedPassword,
        fullName: 'Eva Mobile Dev',
        role: UserRole.VOLUNTEER,
        bio: 'Mobile app developer (React Native & Flutter)',
      },
      {
        email: 'volunteer5@portfoliohub.com',
        username: 'frankdata',
        password: hashedPassword,
        fullName: 'Frank Data Engineer',
        role: UserRole.VOLUNTEER,
        bio: 'Data engineer and ML enthusiast',
        socialLinks: {
          github: 'https://github.com/frankdata',
        },
      },
      {
        email: 'owner2@portfoliohub.com',
        username: 'gracefounder',
        password: hashedPassword,
        fullName: 'Grace Founder',
        role: UserRole.PROJECT_OWNER,
        bio: 'Tech startup founder and investor',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/gracefounder',
          twitter: 'https://twitter.com/gracefounder',
        },
      },
    ];

    const createdUsers = userRepository.create(users);
    await userRepository.save(createdUsers);

    console.log(`✅ Seeded ${createdUsers.length} users successfully!`);
    console.log('📧 Test Accounts (all passwords: password123):');
    console.log('   - admin@portfoliohub.com (Admin)');
    console.log('   - mentor@portfoliohub.com (Mentor)');
    console.log('   - volunteer1@portfoliohub.com (Volunteer)');
    console.log('   - owner@portfoliohub.com (Project Owner)');
  }
}
