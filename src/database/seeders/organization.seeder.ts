import { DataSource } from 'typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';

export class OrganizationSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const organizationRepository = dataSource.getRepository(Organization);

    const organizations = [
      {
        name: 'Tech4Good Foundation',
        description:
          'A non-profit organization dedicated to using technology for social good and community development',
        industry: 'Non-Profit Technology',
        websiteUrl: 'https://tech4good.org',
        logoUrl: 'https://example.com/logos/tech4good.png',
        location: 'Jakarta, Indonesia',
        employeeCount: 25,
        foundedYear: 2018,
        socialLinks: {
          linkedin: 'https://linkedin.com/company/tech4good',
          twitter: 'https://twitter.com/tech4good',
          facebook: 'https://facebook.com/tech4good',
        },
        mission:
          'Empower communities through technology innovation and digital literacy',
        vision:
          'A world where technology serves as a bridge to equal opportunities',
        isActive: true,
      },
      {
        name: 'Digital Innovation Hub',
        description:
          'A collaborative workspace and innovation center for tech enthusiasts and social entrepreneurs',
        industry: 'Technology & Innovation',
        websiteUrl: 'https://diginnovationhub.com',
        logoUrl: 'https://example.com/logos/dih.png',
        location: 'Bandung, Indonesia',
        employeeCount: 15,
        foundedYear: 2020,
        socialLinks: {
          linkedin: 'https://linkedin.com/company/diginnovationhub',
          instagram: 'https://instagram.com/diginnovationhub',
        },
        mission: 'Foster innovation through collaboration and technology',
        vision: 'Be the leading innovation hub in Southeast Asia',
        isActive: true,
      },
      {
        name: 'Green Earth Initiative',
        description:
          'Environmental conservation organization leveraging technology for sustainability',
        industry: 'Environmental Conservation',
        websiteUrl: 'https://greenearth.org',
        logoUrl: 'https://example.com/logos/greenearth.png',
        location: 'Bali, Indonesia',
        employeeCount: 30,
        foundedYear: 2015,
        socialLinks: {
          linkedin: 'https://linkedin.com/company/greenearth',
          twitter: 'https://twitter.com/greenearth',
          instagram: 'https://instagram.com/greenearth',
        },
        mission:
          'Protect and restore our planet through technology-driven solutions',
        vision: 'A sustainable future for generations to come',
        isActive: true,
      },
      {
        name: 'EduTech Solutions',
        description:
          'Educational technology company providing innovative learning platforms',
        industry: 'Education Technology',
        websiteUrl: 'https://edutechsol.com',
        logoUrl: 'https://example.com/logos/edutech.png',
        location: 'Surabaya, Indonesia',
        employeeCount: 50,
        foundedYear: 2017,
        socialLinks: {
          linkedin: 'https://linkedin.com/company/edutechsol',
          youtube: 'https://youtube.com/edutechsol',
        },
        mission:
          'Transform education through innovative technology and accessible learning',
        vision:
          'Quality education accessible to everyone, everywhere',
        isActive: true,
      },
      {
        name: 'Community Connect',
        description:
          'Social platform connecting volunteers with community projects',
        industry: 'Social Impact',
        websiteUrl: 'https://communityconnect.id',
        logoUrl: 'https://example.com/logos/commconnect.png',
        location: 'Yogyakarta, Indonesia',
        employeeCount: 20,
        foundedYear: 2019,
        socialLinks: {
          linkedin: 'https://linkedin.com/company/communityconnect',
          instagram: 'https://instagram.com/communityconnect',
          facebook: 'https://facebook.com/communityconnect',
        },
        mission:
          'Build stronger communities through volunteer engagement',
        vision: 'A connected society where everyone contributes to positive change',
        isActive: true,
      },
    ];

    for (const orgData of organizations) {
      const existingOrg = await organizationRepository.findOne({
        where: { name: orgData.name },
      });

      if (!existingOrg) {
        const organization = organizationRepository.create(orgData);
        await organizationRepository.save(organization);
        console.log(`✓ Organization created: ${orgData.name}`);
      } else {
        console.log(`○ Organization already exists: ${orgData.name}`);
      }
    }
  }
}
