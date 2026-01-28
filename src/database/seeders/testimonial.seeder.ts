import { DataSource } from 'typeorm';
import { Testimonial } from '../../modules/testimonials/entities/testimonial.entity';
import { User } from '../../modules/users/entities/user.entity';

export class TestimonialSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const testimonialRepository = dataSource.getRepository(Testimonial);
    const userRepository = dataSource.getRepository(User);

    // Get some users to add testimonials for
    const users = await userRepository.find({ take: 5 });

    if (users.length === 0) {
      console.log('⚠ No users found. Please seed users first.');
      return;
    }

    const testimonialTemplates = [
      {
        authorName: 'John Smith',
        authorPosition: 'Senior Developer',
        authorCompany: 'Tech Corp',
        content:
          'Outstanding work! This person demonstrated exceptional technical skills and great teamwork throughout our collaboration. Their attention to detail and problem-solving abilities are truly impressive.',
        rating: 5,
        relationship: 'Project Colleague',
        projectContext: 'E-commerce Platform Development',
        isVisible: true,
        isFeatured: true,
      },
      {
        authorName: 'Sarah Johnson',
        authorPosition: 'Product Manager',
        authorCompany: 'InnovateTech',
        content:
          'Highly professional and reliable. They consistently delivered high-quality work on time and were excellent at communicating progress and challenges.',
        rating: 5,
        relationship: 'Direct Manager',
        projectContext: 'Mobile App Redesign',
        isVisible: true,
        isFeatured: true,
      },
      {
        authorName: 'Michael Chen',
        authorPosition: 'Team Lead',
        authorCompany: 'Digital Solutions',
        content:
          'A great team player with strong leadership qualities. Their ability to mentor junior developers while maintaining their own productivity is commendable.',
        rating: 5,
        relationship: 'Team Lead',
        projectContext: 'Cloud Migration Project',
        isVisible: true,
        isFeatured: false,
      },
      {
        authorName: 'Emily Davis',
        authorPosition: 'UX Designer',
        authorCompany: 'Creative Agency',
        content:
          'Excellent collaboration between development and design. They were open to feedback and implemented designs with precision.',
        rating: 4,
        relationship: 'Design Partner',
        projectContext: 'Website Redesign',
        isVisible: true,
        isFeatured: false,
      },
      {
        authorName: 'David Martinez',
        authorPosition: 'CTO',
        authorCompany: 'StartupXYZ',
        content:
          'Innovative thinker with strong technical foundation. Their contributions were instrumental in scaling our platform.',
        rating: 5,
        relationship: 'Direct Supervisor',
        projectContext: 'Platform Scaling Initiative',
        isVisible: true,
        isFeatured: true,
      },
      {
        authorName: 'Lisa Anderson',
        authorPosition: 'Project Coordinator',
        authorCompany: 'Non-Profit Org',
        content:
          'Dedicated and passionate about making a difference. Their volunteer work on our project exceeded expectations.',
        rating: 5,
        relationship: 'Project Coordinator',
        projectContext: 'Community Portal Development',
        isVisible: true,
        isFeatured: false,
      },
      {
        authorName: 'Robert Wilson',
        authorPosition: 'Software Architect',
        authorCompany: 'Enterprise Solutions',
        content:
          'Strong architectural thinking and clean code practices. A valuable asset to any development team.',
        rating: 5,
        relationship: 'Senior Colleague',
        projectContext: 'Microservices Architecture',
        isVisible: true,
        isFeatured: false,
      },
    ];

    let testimonialIndex = 0;
    for (const user of users) {
      // Add 2-3 testimonials per user
      const testimonialsCount = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < testimonialsCount && testimonialIndex < testimonialTemplates.length; i++) {
        const template = testimonialTemplates[testimonialIndex];

        const existingTestimonial = await testimonialRepository.findOne({
          where: {
            userId: user.id,
            authorName: template.authorName,
          },
        });

        if (!existingTestimonial) {
          const testimonial = testimonialRepository.create({
            ...template,
            userId: user.id,
          });
          await testimonialRepository.save(testimonial);
          console.log(
            `✓ Testimonial created for ${user.fullName} by ${template.authorName}`,
          );
        } else {
          console.log(
            `○ Testimonial already exists for ${user.fullName} by ${template.authorName}`,
          );
        }

        testimonialIndex++;
      }
    }
  }
}
