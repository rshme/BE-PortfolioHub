import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { ProjectLevel } from '../../common/enums/project-level.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export class ProjectSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const projectRepository = dataSource.getRepository(Project);
    const userRepository = dataSource.getRepository(User);

    // Check if data already exists
    const count = await projectRepository.count();
    if (count > 0) {
      console.log('✅ Projects already seeded, skipping...');
      return;
    }

    // Get project creators and verifier (admin)
    const creators = await userRepository.find({
      where: { role: UserRole.PROJECT_OWNER },
    });
    const admin = await userRepository.findOne({
      where: { email: 'admin@portfoliohub.com' },
    });

    if (creators.length === 0) {
      console.log('⚠️ No project creators found, skipping projects seeding');
      return;
    }

    // 50% Active, 20% In Progress, 20% Completed, 10% Draft
    const projectTemplates = [
      // ACTIVE PROJECTS (25 projects - 50%)
      {
        name: 'Community Learning Platform',
        description: 'An open-source e-learning platform connecting students with quality educational resources and mentors worldwide.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/community-learning', website: 'https://community-learning.demo.com' },
        isVerified: true,
      },
      {
        name: 'Green Energy Monitor',
        description: 'IoT-based system for monitoring and optimizing renewable energy usage in residential areas.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 10,
        links: { gitlab: 'https://gitlab.com/green-energy-monitor', website: 'https://greenenergy.monitor.io' },
        isVerified: true,
      },
      {
        name: 'Food Waste Tracker',
        description: 'Web app connecting restaurants with surplus food to local food banks and charities.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/food-waste-tracker', website: 'https://foodwaste.tracker.app' },
        isVerified: true,
      },
      {
        name: 'Climate Data Visualization',
        description: 'Interactive dashboard visualizing climate change data and trends to raise public awareness.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 9,
        links: { gitlab: 'https://gitlab.com/climate-data-viz', website: 'https://climate-data.demo.com' },
        isVerified: true,
      },
      {
        name: 'Mental Health Support Chat',
        description: 'Anonymous chat platform connecting individuals with trained mental health support volunteers.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 11,
        links: { github: 'https://github.com/mental-health-chat', website: 'https://mentalhealthsupport.chat' },
        isVerified: true,
      },
      {
        name: 'Urban Garden Mapper',
        description: 'Mapping platform for community gardens and urban farming initiatives.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/urban-garden-mapper', website: 'https://urbangarden.map' },
        isVerified: true,
      },
      {
        name: 'Disaster Relief Coordinator',
        description: 'Emergency response system coordinating volunteers during natural disasters.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 12,
        links: { gitlab: 'https://gitlab.com/disaster-relief', website: 'https://disaster-relief.org' },
        isVerified: true,
      },
      {
        name: 'Open Library Network',
        description: 'Digital library platform sharing educational content across underserved communities.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { github: 'https://github.com/open-library-network', website: 'https://openlibrary.network' },
        isVerified: true,
      },
      {
        name: 'Wildlife Conservation Tracker',
        description: 'Mobile app for tracking and reporting wildlife sightings and conservation efforts.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/wildlife-tracker', website: 'https://wildlife-tracker.org' },
        isVerified: true,
      },
      {
        name: 'Refugee Resource Portal',
        description: 'Comprehensive portal connecting refugees with essential services and resources.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 10,
        links: { gitlab: 'https://gitlab.com/refugee-portal', website: 'https://refugee-resources.org' },
        isVerified: true,
      },
      {
        name: 'Civic Engagement Platform',
        description: 'Platform empowering citizens to participate in local governance and decision-making.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/civic-engage', website: 'https://civicengage.io' },
        isVerified: true,
      },
      {
        name: 'Accessibility Audit Tool',
        description: 'Automated tool for auditing web accessibility compliance and generating reports.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 11,
        links: { github: 'https://github.com/a11y-audit', website: 'https://accessibility-audit.dev' },
        isVerified: true,
      },
      {
        name: 'Community Food Bank System',
        description: 'Inventory and distribution management system for community food banks.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { github: 'https://github.com/foodbank-system', website: 'https://foodbank-mgmt.org' },
        isVerified: true,
      },
      {
        name: 'Water Quality Monitor',
        description: 'Crowdsourced platform for monitoring and reporting water quality in local communities.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 10,
        links: { gitlab: 'https://gitlab.com/water-quality', website: 'https://waterquality.monitor' },
        isVerified: true,
      },
      {
        name: 'Elderly Care Companion',
        description: 'Mobile app connecting elderly individuals with community volunteers for companionship.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: { github: 'https://github.com/elderly-companion', website: 'https://elderlycare.companion' },
        isVerified: true,
      },
      {
        name: 'Public Transport Optimizer',
        description: 'System analyzing and optimizing public transportation routes for better accessibility.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 12,
        links: { github: 'https://github.com/transport-optimizer', website: 'https://transit-optimize.app' },
        isVerified: true,
      },
      {
        name: 'Skills Exchange Platform',
        description: 'Community platform for exchanging skills and knowledge without monetary transactions.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/skills-exchange', website: 'https://skillsexchange.community' },
        isVerified: true,
      },
      {
        name: 'Carbon Footprint Calculator',
        description: 'Personal carbon footprint tracker with actionable recommendations for reduction.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 7,
        links: { gitlab: 'https://gitlab.com/carbon-calc', website: 'https://carbonfootprint.calc' },
        isVerified: true,
      },
      {
        name: 'Nonprofit Dashboard Builder',
        description: 'Customizable dashboard builder for nonprofits to track impact metrics.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 11,
        links: { github: 'https://github.com/nonprofit-dashboard', website: 'https://nonprofit-dash.io' },
        isVerified: true,
      },
      {
        name: 'Community Event Coordinator',
        description: 'Event management platform designed for community organizers and local events.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: { github: 'https://github.com/event-coordinator', website: 'https://community-events.app' },
        isVerified: true,
      },
      {
        name: 'Digital Literacy Program',
        description: 'Online platform teaching digital skills to seniors and underserved populations.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { github: 'https://github.com/digital-literacy', website: 'https://digital-literacy.learn' },
        isVerified: true,
      },
      {
        name: 'Renewable Energy Marketplace',
        description: 'Peer-to-peer marketplace for trading renewable energy credits.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 10,
        links: { gitlab: 'https://gitlab.com/energy-market', website: 'https://renewablemarket.energy' },
        isVerified: true,
      },
      {
        name: 'Homeless Shelter Finder',
        description: 'Mobile app helping homeless individuals find nearby shelters and resources.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/shelter-finder', website: 'https://shelter-finder.help' },
        isVerified: true,
      },
      {
        name: 'Language Learning Exchange',
        description: 'Platform pairing language learners for mutual practice and cultural exchange.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/language-exchange', website: 'https://languageexchange.learn' },
        isVerified: true,
      },
      {
        name: 'Open Science Repository',
        description: 'Repository for sharing and collaborating on open science research data.',
        status: ProjectStatus.ACTIVE,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 12,
        links: { gitlab: 'https://gitlab.com/open-science', website: 'https://openscience.repo' },
        isVerified: true,
      },

      // IN PROGRESS PROJECTS (10 projects - 20%)
      {
        name: 'Healthcare Access App',
        description: 'Mobile application helping underserved communities find and access nearby healthcare facilities.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/healthcare-access', website: 'https://healthaccess.app' },
        isVerified: true,
      },
      {
        name: 'Volunteer Management System',
        description: 'Comprehensive system for NGOs to manage volunteers, track hours, and coordinate projects.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { github: 'https://github.com/volunteer-mgmt', website: 'https://volunteer-mgmt.org' },
        isVerified: true,
      },
      {
        name: 'Student Mentorship Network',
        description: 'Platform connecting students with mentors in their fields of interest.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/student-mentorship', website: 'https://mentorship.network' },
        isVerified: true,
      },
      {
        name: 'Neighborhood Watch App',
        description: 'Community safety app for organizing and coordinating neighborhood watch programs.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: { github: 'https://github.com/neighborhood-watch', website: 'https://neighborhood-watch.app' },
        isVerified: false,
      },
      {
        name: 'Fair Trade Marketplace',
        description: 'E-commerce platform exclusively for fair trade and ethically sourced products.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 11,
        links: { gitlab: 'https://gitlab.com/fairtrade-market', website: 'https://fairtrade.market' },
        isVerified: true,
      },
      {
        name: 'Community Radio Platform',
        description: 'Web-based community radio station with podcast hosting capabilities.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/community-radio', website: 'https://community-radio.live' },
        isVerified: false,
      },
      {
        name: 'Pet Adoption Network',
        description: 'Platform connecting animal shelters with potential pet adopters.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/pet-adoption', website: 'https://petadoption.network' },
        isVerified: true,
      },
      {
        name: 'Sustainable Fashion Tracker',
        description: 'App tracking sustainability credentials of fashion brands and products.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { gitlab: 'https://gitlab.com/sustainable-fashion', website: 'https://sustainablefashion.track' },
        isVerified: false,
      },
      {
        name: 'Community Tool Library',
        description: 'Tool lending library management system for community sharing programs.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 10,
        links: { github: 'https://github.com/tool-library', website: 'https://toollibrary.community' },
        isVerified: true,
      },
      {
        name: 'Youth Entrepreneurship Hub',
        description: 'Platform supporting young entrepreneurs with resources and mentorship.',
        status: ProjectStatus.IN_PROGRESS,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 12,
        links: { github: 'https://github.com/youth-entrepreneur', website: 'https://youthentrepreneurs.hub' },
        isVerified: true,
      },

      // COMPLETED PROJECTS (10 projects - 20%)
      {
        name: 'Local Business Directory',
        description: 'Community-driven directory helping people discover and support local small businesses.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: { github: 'https://github.com/local-biz-directory', website: 'https://localbiz.directory' },
        isVerified: true,
      },
      {
        name: 'Recycling Guide App',
        description: 'Educational app teaching proper recycling practices by location.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/recycling-guide', website: 'https://recycling-guide.eco' },
        isVerified: true,
      },
      {
        name: 'Community Garden Planner',
        description: 'Planning tool for community garden layouts and crop rotation schedules.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/garden-planner', website: 'https://garden-planner.app' },
        isVerified: true,
      },
      {
        name: 'Literacy Tutoring Scheduler',
        description: 'Scheduling system for volunteer literacy tutors and students.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: { github: 'https://github.com/literacy-scheduler', website: 'https://literacy-tutor.schedule' },
        isVerified: true,
      },
      {
        name: 'Donation Tracker System',
        description: 'Tracking system for charitable donations and generating tax receipts.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { gitlab: 'https://gitlab.com/donation-tracker', website: 'https://donation-tracker.org' },
        isVerified: true,
      },
      {
        name: 'Emergency Alert System',
        description: 'Community-based emergency notification system for local alerts.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 11,
        links: { github: 'https://github.com/emergency-alerts', website: 'https://emergency-alert.system' },
        isVerified: true,
      },
      {
        name: 'Free Meal Locator',
        description: 'App helping people find free meal programs and food distribution events.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 7,
        links: { github: 'https://github.com/free-meal-locator', website: 'https://freemeals.locate' },
        isVerified: true,
      },
      {
        name: 'Community Calendar',
        description: 'Shared calendar for local community events and activities.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.BEGINNER,
        volunteersNeeded: 6,
        links: { github: 'https://github.com/community-calendar', website: 'https://community-calendar.app' },
        isVerified: true,
      },
      {
        name: 'Voter Registration Portal',
        description: 'Streamlined portal for voter registration and election information.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 10,
        links: { gitlab: 'https://gitlab.com/voter-registration', website: 'https://voter-register.gov' },
        isVerified: true,
      },
      {
        name: 'Child Safety App',
        description: 'Safety tracking app for parents to monitor children in public spaces.',
        status: ProjectStatus.COMPLETED,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 12,
        links: { github: 'https://github.com/child-safety', website: 'https://childsafety.app' },
        isVerified: true,
      },

      // DRAFT PROJECTS (5 projects - 10%)
      {
        name: 'Open Source Documentation Hub',
        description: 'Collaborative platform for creating and maintaining high-quality documentation for open-source projects.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 8,
        links: { github: 'https://github.com/os-docs-hub', figma: 'https://figma.com/file/docs-hub-design' },
        isVerified: false,
      },
      {
        name: 'Code Review Buddy',
        description: 'AI-assisted code review tool helping developers learn best practices and improve code quality.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 10,
        links: { gitlab: 'https://gitlab.com/code-review-buddy', figma: 'https://figma.com/file/code-review-buddy' },
        isVerified: false,
      },
      {
        name: 'Blockchain Voting System',
        description: 'Secure blockchain-based voting system for organizational elections.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 12,
        links: { github: 'https://github.com/blockchain-voting', figma: 'https://figma.com/file/blockchain-voting' },
        isVerified: false,
      },
      {
        name: 'Agricultural Knowledge Base',
        description: 'Crowdsourced knowledge base for sustainable farming practices.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.INTERMEDIATE,
        volunteersNeeded: 9,
        links: { gitlab: 'https://gitlab.com/agri-knowledge', figma: 'https://figma.com/file/agri-kb' },
        isVerified: false,
      },
      {
        name: 'Crisis Intervention Chatbot',
        description: 'AI chatbot providing immediate support during mental health crises.',
        status: ProjectStatus.DRAFT,
        level: ProjectLevel.ADVANCED,
        volunteersNeeded: 11,
        links: { github: 'https://github.com/crisis-chatbot', figma: 'https://figma.com/file/crisis-bot' },
        isVerified: false,
      },
    ];

    const projects: Array<{
      creatorId: string;
      name: string;
      description: string;
      status: ProjectStatus;
      level: ProjectLevel;
      volunteersNeeded: number;
      volunteerCount: number;
      startDate?: Date;
      endDate?: Date;
      links: Record<string, string | undefined>;
      images: string[];
      bannerUrl?: string;
      isVerified: boolean;
      verifiedBy?: string;
    }> = [];

    // Distribute all 50 projects among creators
    const shuffledTemplates = [...projectTemplates].sort(() => 0.5 - Math.random());
    let templateIndex = 0;

    for (const creator of creators) {
      const projectsPerCreator = Math.ceil(projectTemplates.length / creators.length);
      const selectedTemplates = shuffledTemplates.slice(templateIndex, templateIndex + projectsPerCreator);
      templateIndex += projectsPerCreator;

      for (const template of selectedTemplates) {
        if (!template) continue;
        const startDate = template.status !== ProjectStatus.DRAFT
          ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) // Random date in last 6 months
          : undefined;
        
        const endDate = startDate && template.status !== ProjectStatus.COMPLETED
          ? new Date(startDate.getTime() + (Math.random() * 180 + 90) * 24 * 60 * 60 * 1000) // 3-9 months from start
          : startDate
          ? new Date(startDate.getTime() + Math.random() * 120 * 24 * 60 * 60 * 1000) // completed within 4 months
          : undefined;

        const imageCount = Math.floor(Math.random() * 3); // 0-2 images
        const images = Array.from({ length: imageCount }, (_, i) => 
          `https://picsum.photos/800/600?random=${Math.random()}`
        );

        projects.push({
          creatorId: creator.id,
          name: template.name,
          description: template.description,
          status: template.status,
          level: template.level,
          volunteersNeeded: template.volunteersNeeded,
          volunteerCount: 0,
          startDate,
          endDate,
          links: template.links,
          images,
          bannerUrl: Math.random() > 0.3 ? `https://picsum.photos/1200/400?random=${Math.random()}` : undefined,
          isVerified: template.isVerified,
          verifiedBy: template.isVerified ? admin?.id : undefined,
        });
      }
    }

    await projectRepository.save(projects);
    console.log(`✅ Seeded ${projects.length} projects`);
  }
}
