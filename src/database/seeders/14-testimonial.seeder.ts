import { DataSource } from 'typeorm';
import { Testimonial } from '../../modules/testimonials/entities/testimonial.entity';
import { User } from '../../modules/users/entities/user.entity';

export class TestimonialSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const testimonialRepository = dataSource.getRepository(Testimonial);
    const userRepository = dataSource.getRepository(User);

    // Check if data already exists
    const count = await testimonialRepository.count();
    if (count > 0) {
      console.log('✅ Testimonials already seeded, skipping...');
      return;
    }

    // Get users
    const users = await userRepository.find();

    if (users.length < 2) {
      console.log('⚠️ Not enough users found, skipping testimonials seeding');
      return;
    }

    const testimonials: Array<{
      userId: string;
      reviewerId: string;
      content: string;
      rating: number;
      relationship: string;
      projectContext: string | undefined;
      isVisible: boolean;
      isFeatured: boolean;
    }> = [];

    // Create testimonials between users
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Skip admin
      if (user.email === 'admin@portfoliohub.com') continue;

      // Get 0-2 random reviewers for this user
      const reviewerCount = Math.floor(Math.random() * 3); // 0 to 2 testimonials
      if (reviewerCount === 0) continue;
      
      for (let j = 0; j < reviewerCount; j++) {
        // Get a random user as reviewer (different from the user)
        let reviewer;
        do {
          reviewer = users[Math.floor(Math.random() * users.length)];
        } while (reviewer.id === user.id);

        const relationships = [
          'Colleague',
          'Mentor',
          'Project Lead',
          'Team Member',
          'Client',
          'Manager',
        ];
        
        const contents = [
          `${user.fullName} is an exceptional professional who consistently delivers high-quality work. Their technical skills and collaborative attitude make them a valuable asset to any team.`,
          `I had the pleasure of working with ${user.fullName} on multiple projects. Their dedication, expertise, and problem-solving abilities are truly outstanding.`,
          `${user.fullName} demonstrated exceptional leadership and technical proficiency throughout our collaboration. Highly recommended!`,
          `Working with ${user.fullName} was a great experience. They bring both technical excellence and strong communication skills to every project.`,
          `${user.fullName} is a talented developer with a keen eye for detail. Their contributions significantly improved our project outcomes.`,
          `I highly recommend ${user.fullName}. Their passion for technology and commitment to excellence shine through in everything they do.`,
        ];

        testimonials.push({
          userId: user.id,
          reviewerId: reviewer.id,
          content: contents[Math.floor(Math.random() * contents.length)],
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          relationship:
            relationships[Math.floor(Math.random() * relationships.length)],
          projectContext: Math.random() > 0.5 ? 'Community Learning Platform' : undefined,
          isVisible: true,
          isFeatured: Math.random() > 0.7, // 30% chance of being featured
        });
      }
    }

    if (testimonials.length > 0) {
      await testimonialRepository.save(testimonials);
      console.log(`✅ Seeded ${testimonials.length} testimonials`);
    } else {
      console.log('✅ No testimonials to seed');
    }
  }
}
