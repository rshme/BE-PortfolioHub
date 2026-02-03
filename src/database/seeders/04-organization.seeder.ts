import { DataSource } from 'typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';

export class OrganizationSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const organizationRepository = dataSource.getRepository(Organization);

    // Check if data already exists
    const count = await organizationRepository.count();
    if (count > 0) {
      console.log('✅ Organizations already seeded, skipping...');
      return;
    }

    const organizations = [
      {
        name: 'Tech For Good Foundation',
        description:
          'A non-profit organization focused on using technology to solve social problems and improve lives in underserved communities.',
        industry: 'Non-Profit',
        websiteUrl: 'https://techforgood.org',
        logoUrl: 'https://example.com/logos/techforgood.png',
        location: 'San Francisco, CA',
        employeeCount: 25,
        foundedYear: 2018,
        socialLinks: {
          twitter: 'https://twitter.com/techforgood',
          linkedin: 'https://linkedin.com/company/techforgood',
          github: 'https://github.com/techforgood',
        },
        mission:
          'Empowering communities through innovative technology solutions',
        vision:
          'A world where technology serves humanity and creates equal opportunities for all',
        isActive: true,
      },
      {
        name: 'Green Earth Initiative',
        description:
          'Environmental organization dedicated to combating climate change through sustainable technology and community engagement.',
        industry: 'Environmental',
        websiteUrl: 'https://greenearthinitiative.org',
        logoUrl: 'https://example.com/logos/greenearth.png',
        location: 'Portland, OR',
        employeeCount: 40,
        foundedYear: 2015,
        socialLinks: {
          twitter: 'https://twitter.com/greenearth',
          linkedin: 'https://linkedin.com/company/greenearth',
          instagram: 'https://instagram.com/greenearth',
        },
        mission: 'Protecting our planet through sustainable innovation',
        vision: 'A carbon-neutral world by 2050',
        isActive: true,
      },
      {
        name: 'EduTech Innovations',
        description:
          'Revolutionizing education through cutting-edge technology and accessible learning platforms for students worldwide.',
        industry: 'Education Technology',
        websiteUrl: 'https://edutechinnovations.com',
        logoUrl: 'https://example.com/logos/edutech.png',
        location: 'Boston, MA',
        employeeCount: 150,
        foundedYear: 2016,
        socialLinks: {
          twitter: 'https://twitter.com/edutech',
          linkedin: 'https://linkedin.com/company/edutech',
          facebook: 'https://facebook.com/edutech',
        },
        mission: 'Making quality education accessible to everyone',
        vision: 'Empowering learners globally through technology',
        isActive: true,
      },
      {
        name: 'HealthConnect Network',
        description:
          'Healthcare technology organization improving patient care and medical accessibility through innovative digital solutions.',
        industry: 'Healthcare Technology',
        websiteUrl: 'https://healthconnect.io',
        logoUrl: 'https://example.com/logos/healthconnect.png',
        location: 'New York, NY',
        employeeCount: 200,
        foundedYear: 2017,
        socialLinks: {
          twitter: 'https://twitter.com/healthconnect',
          linkedin: 'https://linkedin.com/company/healthconnect',
        },
        mission: 'Connecting patients with quality healthcare',
        vision: 'Affordable and accessible healthcare for all',
        isActive: true,
      },
      {
        name: 'Community Builders Hub',
        description:
          'Platform connecting volunteers with community projects and social initiatives to create meaningful local impact.',
        industry: 'Social Impact',
        websiteUrl: 'https://communitybuildershub.org',
        logoUrl: 'https://example.com/logos/communityhub.png',
        location: 'Austin, TX',
        employeeCount: 30,
        foundedYear: 2019,
        socialLinks: {
          twitter: 'https://twitter.com/communityhub',
          linkedin: 'https://linkedin.com/company/communityhub',
          instagram: 'https://instagram.com/communityhub',
        },
        mission: 'Building stronger communities through collaboration',
        vision: 'Empowered communities solving local challenges together',
        isActive: true,
      },
      {
        name: 'Open Source Collective',
        description:
          'Supporting open-source projects and developers through funding, mentorship, and community building initiatives.',
        industry: 'Technology',
        websiteUrl: 'https://opensourcecollective.org',
        logoUrl: 'https://example.com/logos/opensource.png',
        location: 'Seattle, WA',
        employeeCount: 15,
        foundedYear: 2020,
        socialLinks: {
          twitter: 'https://twitter.com/oscollective',
          github: 'https://github.com/oscollective',
          discord: 'https://discord.gg/oscollective',
        },
        mission: 'Fostering the open-source ecosystem',
        vision: 'A thriving, sustainable open-source community',
        isActive: true,
      },
    ];

    await organizationRepository.save(organizations);
    console.log(`✅ Seeded ${organizations.length} organizations`);
  }
}
