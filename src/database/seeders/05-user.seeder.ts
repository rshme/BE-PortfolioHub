import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

export class UserSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const organizationRepository = dataSource.getRepository(Organization);

    // Check if data already exists
    const count = await userRepository.count();
    if (count > 0) {
      console.log('✅ Users already seeded, skipping...');
      return;
    }

    // Get organizations for assignment
    const organizations = await organizationRepository.find();

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const users = [
      {
        email: 'admin@portfoliohub.com',
        username: 'admin',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        bio: 'Platform administrator managing the entire system',
        socialLinks: {
          github: 'https://github.com/admin',
          linkedin: 'https://linkedin.com/in/admin',
        },
        organizationId: undefined,
      },
      {
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: hashedPassword,
        fullName: 'John Doe',
        role: UserRole.PROJECT_OWNER,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
        bio: 'Full-stack developer passionate about creating impactful projects',
        socialLinks: {
          github: 'https://github.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe',
        },
        organizationId: organizations[0]?.id,
      },
      {
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: hashedPassword,
        fullName: 'Jane Smith',
        role: UserRole.MENTOR,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=janesmith',
        bio: 'Senior software engineer and mentor with 10+ years of experience',
        socialLinks: {
          github: 'https://github.com/janesmith',
          linkedin: 'https://linkedin.com/in/janesmith',
        },
        organizationId: organizations[1]?.id,
      },
      {
        email: 'mike.wilson@example.com',
        username: 'mikewilson',
        password: hashedPassword,
        fullName: 'Mike Wilson',
        role: UserRole.VOLUNTEER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=mikewilson',
        bio: 'Enthusiastic volunteer looking to contribute to meaningful projects',
        socialLinks: {
          github: 'https://github.com/mikewilson',
        },
        organizationId: undefined,
      },
      {
        email: 'sarah.johnson@example.com',
        username: 'sarahjohnson',
        password: hashedPassword,
        fullName: 'Sarah Johnson',
        role: UserRole.PROJECT_OWNER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahjohnson',
        bio: 'UX designer and project manager creating user-centered solutions',
        socialLinks: {
          github: 'https://github.com/sarahjohnson',
          linkedin: 'https://linkedin.com/in/sarahjohnson',
          behance: 'https://behance.net/sarahjohnson',
        },
        organizationId: organizations[2]?.id,
      },
      {
        email: 'alex.brown@example.com',
        username: 'alexbrown',
        password: hashedPassword,
        fullName: 'Alex Brown',
        role: UserRole.MENTOR,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexbrown',
        bio: 'Data scientist and AI researcher mentoring the next generation',
        socialLinks: {
          github: 'https://github.com/alexbrown',
          linkedin: 'https://linkedin.com/in/alexbrown',
        },
        organizationId: organizations[3]?.id,
      },
      {
        email: 'emily.davis@example.com',
        username: 'emilydavis',
        password: hashedPassword,
        fullName: 'Emily Davis',
        role: UserRole.VOLUNTEER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=emilydavis',
        bio: 'Frontend developer eager to learn and contribute',
        socialLinks: {
          github: 'https://github.com/emilydavis',
          twitter: 'https://twitter.com/emilydavis',
        },
        organizationId: undefined,
      },
      {
        email: 'david.miller@example.com',
        username: 'davidmiller',
        password: hashedPassword,
        fullName: 'David Miller',
        role: UserRole.PROJECT_OWNER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=davidmiller',
        bio: 'Backend engineer building scalable systems',
        socialLinks: {
          github: 'https://github.com/davidmiller',
          linkedin: 'https://linkedin.com/in/davidmiller',
        },
        organizationId: organizations[4]?.id,
      },
      {
        email: 'lisa.anderson@example.com',
        username: 'lisaanderson',
        password: hashedPassword,
        fullName: 'Lisa Anderson',
        role: UserRole.VOLUNTEER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=lisaanderson',
        bio: 'Mobile developer interested in cross-platform development',
        socialLinks: {
          github: 'https://github.com/lisaanderson',
        },
        organizationId: undefined,
      },
      {
        email: 'robert.taylor@example.com',
        username: 'roberttaylor',
        password: hashedPassword,
        fullName: 'Robert Taylor',
        role: UserRole.MENTOR,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=roberttaylor',
        bio: 'DevOps expert and cloud architect',
        socialLinks: {
          github: 'https://github.com/roberttaylor',
          linkedin: 'https://linkedin.com/in/roberttaylor',
        },
        organizationId: organizations[5]?.id,
      },
      {
        email: 'maria.garcia@example.com',
        username: 'mariagarcia',
        password: hashedPassword,
        fullName: 'Maria Garcia',
        role: UserRole.VOLUNTEER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=mariagarcia',
        bio: 'Computer science student passionate about open source',
        socialLinks: {
          github: 'https://github.com/mariagarcia',
          twitter: 'https://twitter.com/mariagarcia',
        },
        organizationId: undefined,
      },
      {
        email: 'james.martinez@example.com',
        username: 'jamesmartinez',
        password: hashedPassword,
        fullName: 'James Martinez',
        role: UserRole.PROJECT_OWNER,
        avatarUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=jamesmartinez',
        bio: 'Blockchain developer and cryptocurrency enthusiast',
        socialLinks: {
          github: 'https://github.com/jamesmartinez',
          linkedin: 'https://linkedin.com/in/jamesmartinez',
        },
        organizationId: organizations[0]?.id,
      },
    ];

    // Add 25 volunteers
    for (let i = 1; i <= 25; i++) {
      const username = `volunteer${i}`;
      users.push({
        email: `volunteer${i}@example.com`,
        username,
        password: hashedPassword,
        fullName: `Volunteer User ${i}`,
        role: UserRole.VOLUNTEER,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: `Volunteer passionate about contributing to open source projects`,
        socialLinks: {
          github: `https://github.com/${username}`,
        },
        organizationId: undefined,
      });
    }

    // Add 25 mentors
    for (let i = 1; i <= 25; i++) {
      const username = `mentor${i}`;
      const orgIndex = i % organizations.length;
      users.push({
        email: `mentor${i}@example.com`,
        username,
        password: hashedPassword,
        fullName: `Mentor User ${i}`,
        role: UserRole.MENTOR,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: `Experienced mentor helping developers grow their skills`,
        socialLinks: {
          github: `https://github.com/${username}`,
          linkedin: `https://linkedin.com/in/${username}`,
        },
        organizationId: organizations[orgIndex]?.id,
      });
    }

    // Add 25 project owners/creators
    for (let i = 1; i <= 25; i++) {
      const username = `creator${i}`;
      const orgIndex = i % organizations.length;
      users.push({
        email: `creator${i}@example.com`,
        username,
        password: hashedPassword,
        fullName: `Project Creator ${i}`,
        role: UserRole.PROJECT_OWNER,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: `Project creator building innovative solutions for social impact`,
        socialLinks: {
          github: `https://github.com/${username}`,
          linkedin: `https://linkedin.com/in/${username}`,
        },
        organizationId: organizations[orgIndex]?.id,
      });
    }

    await userRepository.save(users);
    console.log(`✅ Seeded ${users.length} users`);
  }
}
