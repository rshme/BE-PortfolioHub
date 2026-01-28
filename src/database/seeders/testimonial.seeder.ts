import { DataSource } from 'typeorm';
import { Testimonial } from '../../modules/testimonials/entities/testimonial.entity';
import { User } from '../../modules/users/entities/user.entity';

export class TestimonialSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const testimonialRepository = dataSource.getRepository(Testimonial);
    const userRepository = dataSource.getRepository(User);

    // Get users to add testimonials for and reviewers
    const users = await userRepository.find({ take: 10 });

    if (users.length < 2) {
      console.log('⚠ Not enough users found. Please seed users first.');
      return;
    }

    const testimonialTemplates = [
      {
        content:
          'Outstanding work! This person demonstrated exceptional technical skills and great teamwork throughout our collaboration. Their attention to detail and problem-solving abilities are truly impressive.',
        rating: 5,
        relationship: 'Project Colleague',
        projectContext: 'E-commerce Platform Development',
        isVisible: true,
        isFeatured: true,
      },
      {
        content:
          'Highly professional and reliable. They consistently delivered high-quality work on time and were excellent at communicating progress and challenges.',
        rating: 5,
        relationship: 'Direct Manager',
        projectContext: 'Mobile App Redesign',
        isVisible: true,
        isFeatured: true,
      },
      {
        content:
          'A great team player with strong leadership qualities. Their ability to mentor junior developers while maintaining their own productivity is commendable.',
        rating: 5,
        relationship: 'Team Lead',
        projectContext: 'Cloud Migration Project',
        isVisible: true,
        isFeatured: false,
      },
      {
        content:
          'Excellent collaboration between development and design. They were open to feedback and implemented designs with precision.',
        rating: 4,
        relationship: 'Design Partner',
        projectContext: 'Website Redesign',
        isVisible: true,
        isFeatured: false,
      },
      {
        content:
          'Innovative thinker with strong technical foundation. Their contributions were instrumental in scaling our platform.',
        rating: 5,
        relationship: 'Direct Supervisor',
        projectContext: 'Platform Scaling Initiative',
        isVisible: true,
        isFeatured: true,
      },
      {
        content:
          'Dedicated and passionate about making a difference. Their volunteer work on our project exceeded expectations.',
        rating: 5,
        relationship: 'Project Coordinator',
        projectContext: 'Community Portal Development',
        isVisible: true,
        isFeatured: false,
      },
      {
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
    // Create testimonials where users[i] receives testimonials from users[j]
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i]; // User receiving testimonial
      
      // Add 2-3 testimonials per user from different reviewers
      const testimonialsCount = Math.floor(Math.random() * 2) + 2;

      for (let j = 0; j < testimonialsCount && testimonialIndex < testimonialTemplates.length; j++) {
        // Get a different user as reviewer (not the same as the user receiving)
        const reviewerIndex = (i + j + 1) % users.length;
        const reviewer = users[reviewerIndex];
        
        if (reviewer.id === user.id) continue; // Skip if same user

        const template = testimonialTemplates[testimonialIndex];

        const existingTestimonial = await testimonialRepository.findOne({
          where: {
            userId: user.id,
            reviewerId: reviewer.id,
          },
        });

        if (!existingTestimonial) {
          const testimonial = testimonialRepository.create({
            ...template,
            userId: user.id,
            reviewerId: reviewer.id,
          });
          await testimonialRepository.save(testimonial);
          console.log(
            `✓ Testimonial created for ${user.fullName} by ${reviewer.fullName}`,
          );
        } else {
          console.log(
            `○ Testimonial already exists for ${user.fullName} by ${reviewer.fullName}`,
          );
        }

        testimonialIndex++;
      }
    }
  }
}
