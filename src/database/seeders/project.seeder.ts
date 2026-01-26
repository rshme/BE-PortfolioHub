import { DataSource } from 'typeorm';
import { Project } from '../../modules/projects/entities/project.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Skill } from '../../modules/skills/entities/skill.entity';
import { ProjectStatus } from '../../common/enums/project-status.enum';
import { ProjectLevel } from '../../common/enums/project-level.enum';
import { ProjectVolunteer } from '../../modules/projects/entities/project-volunteer.entity';
import { ProjectMentor } from '../../modules/projects/entities/project-mentor.entity';
import { ProjectCategory } from '../../modules/projects/entities/project-category.entity';
import { ProjectSkill } from '../../modules/projects/entities/project-skill.entity';
import { VolunteerStatus } from '../../common/enums/volunteer-status.enum';
import { MentorStatus } from '../../common/enums/mentor-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export const seedProjects = async (dataSource: DataSource): Promise<void> => {
  const projectRepository = dataSource.getRepository(Project);
  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const skillRepository = dataSource.getRepository(Skill);
  const projectVolunteerRepository = dataSource.getRepository(ProjectVolunteer);
  const projectMentorRepository = dataSource.getRepository(ProjectMentor);
  const projectCategoryRepository = dataSource.getRepository(ProjectCategory);
  const projectSkillRepository = dataSource.getRepository(ProjectSkill);

  // Check if projects already exist
  const existingProjects = await projectRepository.count();
  if (existingProjects > 0) {
    console.log('Projects already exist, skipping seed...');
    return;
  }

  // Get users by role
  const projectOwners = await userRepository.find({
    where: { role: UserRole.PROJECT_OWNER },
  });
  const mentors = await userRepository.find({
    where: { role: UserRole.MENTOR },
  });
  const volunteers = await userRepository.find({
    where: { role: UserRole.VOLUNTEER },
  });
  const adminUser = await userRepository.findOne({
    where: { role: UserRole.ADMIN },
  });

  if (projectOwners.length === 0) {
    console.log('⚠️  No project owners found. Please run user seeder first.');
    return;
  }

  // Get all categories and skills
  const allCategories = await categoryRepository.find();
  const allSkills = await skillRepository.find();

  // Helper function to get random elements from array
  const getRandomElements = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
  };

  // Helper function to get random element
  const getRandomElement = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const projectTemplates = [
    {
      name: 'EduConnect - Online Learning Platform',
      description: 'A comprehensive e-learning platform that connects students with quality educational resources and interactive courses. Features include live classes, assignments, progress tracking, and community forums.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'GreenCart - Sustainable Shopping App',
      description: 'Mobile marketplace connecting eco-conscious consumers with sustainable local businesses. Track your carbon footprint, earn rewards for green choices, and discover eco-friendly alternatives.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
    },
    {
      name: 'HealthTracker AI - Personal Health Assistant',
      description: 'AI-powered health monitoring application that analyzes user health data, provides personalized recommendations, and predicts potential health risks using machine learning algorithms.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 10,
    },
    {
      name: 'CodeCollab - Real-time Collaborative IDE',
      description: 'Open-source web-based IDE for remote pair programming and collaborative coding. Features include real-time code sync, video chat, code review tools, and integrated version control.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 12,
    },
    {
      name: 'VolunteerHub - Community Service Platform',
      description: 'Platform connecting volunteers with local non-profit organizations. Features include event management, volunteer matching, impact tracking, and community recognition system.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
    },
    {
      name: 'SmartFinance - Personal Budget Manager',
      description: 'Intelligent personal finance application that helps users track expenses, create budgets, set financial goals, and get AI-powered savings recommendations.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'FoodShare - Community Food Donation Network',
      description: 'Platform connecting restaurants and grocery stores with food banks and shelters to reduce waste. Real-time inventory tracking, delivery coordination, and impact analytics.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'DevMentor - Peer Learning Platform',
      description: 'Connect junior developers with experienced mentors for code reviews, career guidance, and skill development. Features include video calls, code sharing, and progress tracking.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
    },
    {
      name: 'ClimateAction - Carbon Footprint Tracker',
      description: 'Mobile app helping users track and reduce their carbon footprint through daily activities. Gamification, challenges, and community goals to encourage sustainable living.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 9,
    },
    {
      name: 'OpenLibrary - Digital Book Exchange',
      description: 'Decentralized platform for sharing and exchanging books within communities. Features include book tracking, reading recommendations, and local meetup organization.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'MediConnect - Healthcare Appointment System',
      description: 'Comprehensive healthcare management system for booking appointments, managing medical records, and telemedicine consultations. HIPAA compliant with end-to-end encryption.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 15,
    },
    {
      name: 'ArtGallery - Digital Art Marketplace',
      description: 'NFT-based platform for digital artists to showcase and sell their artwork. Features include auction system, royalty management, and artist verification.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 12,
    },
    {
      name: 'StudyBuddy - Student Collaboration Tool',
      description: 'Platform for students to form study groups, share notes, and collaborate on projects. Includes calendar integration, document sharing, and video conferencing.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
    },
    {
      name: 'JobBoard - Tech Career Platform',
      description: 'Job board specifically for tech roles with advanced filtering, skill matching, and company reviews. Includes salary insights and interview preparation resources.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'FitnessPal - Workout Tracking App',
      description: 'Comprehensive fitness application with workout plans, nutrition tracking, progress photos, and social features. AI-powered form correction using computer vision.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 11,
    },
    {
      name: 'PetAdopt - Animal Rescue Network',
      description: 'Platform connecting animal shelters with potential adopters. Features include pet profiles, adoption applications, foster programs, and donation management.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
    },
    {
      name: 'TravelMate - Trip Planning Assistant',
      description: 'AI-powered travel planning app that creates personalized itineraries based on preferences, budget, and travel style. Includes booking integration and travel tips.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 9,
    },
    {
      name: 'CryptoWallet - Secure Digital Wallet',
      description: 'Multi-chain cryptocurrency wallet with advanced security features, portfolio tracking, and DeFi integration. Support for hardware wallets and multi-signature transactions.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 13,
    },
    {
      name: 'RecipeBox - Community Cookbook',
      description: 'Social platform for sharing and discovering recipes. Features include meal planning, grocery lists, dietary filters, and cooking tutorials.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'EventHub - Community Event Organizer',
      description: 'Platform for organizing and discovering local events. Includes ticketing, RSVPs, event recommendations, and attendee networking features.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'CodeReview - Automated Code Analysis',
      description: 'AI-powered code review tool that provides suggestions for improvements, detects bugs, and ensures code quality standards. Integration with popular Git platforms.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 14,
    },
    {
      name: 'MusicStream - Independent Artist Platform',
      description: 'Streaming platform for independent musicians with fair revenue sharing. Features include playlist creation, artist analytics, and fan engagement tools.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 12,
    },
    {
      name: 'TaskMaster - Project Management Tool',
      description: 'Collaborative project management application with kanban boards, Gantt charts, time tracking, and team communication features.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'EcoTravel - Sustainable Tourism Guide',
      description: 'Travel guide focused on eco-friendly destinations, sustainable accommodations, and responsible tourism practices. Carbon offset calculator included.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
    },
    {
      name: 'SmartHome - IoT Device Manager',
      description: 'Unified platform for managing all smart home devices. Automation rules, energy monitoring, security features, and voice assistant integration.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 11,
    },
    {
      name: 'LanguageExchange - Language Learning Community',
      description: 'Connect with native speakers for language practice through video calls and text chat. Includes structured lessons and progress tracking.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
    },
    {
      name: 'NewsAggregator - Personalized News Feed',
      description: 'AI-powered news aggregator that curates articles based on interests while avoiding filter bubbles. Fact-checking integration and source verification.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 10,
    },
    {
      name: 'GardenPlanner - Urban Gardening App',
      description: 'Help urban gardeners plan and maintain their gardens with plant databases, growing schedules, and community tips. AR plant identification feature.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'FreelanceHub - Freelancer Management Platform',
      description: 'All-in-one platform for freelancers to manage projects, invoices, time tracking, and client communication. Tax calculation and expense tracking included.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 9,
    },
    {
      name: 'VirtualClassroom - Online Teaching Platform',
      description: 'Interactive virtual classroom with whiteboard, screen sharing, breakout rooms, and assignment management. Designed for K-12 and higher education.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 13,
    },
    {
      name: 'WeatherPro - Advanced Weather Forecasting',
      description: 'Hyper-local weather forecasting app using machine learning and multiple data sources. Severe weather alerts and agricultural insights.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 11,
    },
    {
      name: 'BudgetTracker - Family Finance Manager',
      description: 'Family-focused budgeting app with shared accounts, allowance management, and financial literacy resources for kids. Goal tracking and savings challenges.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
    },
    {
      name: 'PropertyManager - Real Estate Management',
      description: 'Comprehensive property management system for landlords and property managers. Tenant portals, maintenance requests, rent collection, and financial reporting.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 10,
    },
    {
      name: 'CodeSnippet - Developer Code Library',
      description: 'Personal code snippet manager with syntax highlighting, tagging, and search. Team collaboration features and IDE integration.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'MentalHealth - Wellness Companion App',
      description: 'Mental health support app with mood tracking, meditation guides, therapy resources, and crisis intervention. Privacy-focused with end-to-end encryption.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 12,
    },
    {
      name: 'CarPool - Ride Sharing Network',
      description: 'Eco-friendly carpooling platform for commuters. Route matching, cost splitting, carbon savings tracking, and driver verification.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'BlogPlatform - Modern Blogging CMS',
      description: 'Open-source blogging platform with markdown support, SEO optimization, analytics, and monetization options. Mobile-responsive themes and plugin architecture.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
    },
    {
      name: 'DataViz - Business Intelligence Dashboard',
      description: 'Create interactive data visualizations and dashboards without coding. Connect to various data sources, real-time updates, and collaboration features.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 14,
    },
    {
      name: 'KidsLearn - Educational Games Platform',
      description: 'Interactive learning games for children ages 5-12. Subjects include math, science, reading, and critical thinking. Parent dashboard for progress tracking.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 9,
    },
    {
      name: 'SecureChat - Privacy-First Messenger',
      description: 'End-to-end encrypted messaging app with disappearing messages, voice/video calls, and file sharing. No phone number required, blockchain-based identity.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 15,
    },
    {
      name: 'FarmToTable - Local Food Network',
      description: 'Connect local farmers with consumers for fresh produce delivery. CSA management, seasonal meal planning, and farm visit scheduling.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
    },
    {
      name: 'WorkoutBuddy - Exercise Social Network',
      description: 'Social platform for fitness enthusiasts to share workouts, track progress, and motivate each other. Integration with fitness trackers and wearables.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 6,
    },
    {
      name: 'InvoiceGenerator - Business Billing Tool',
      description: 'Simple yet powerful invoicing tool for small businesses. Recurring invoices, payment tracking, expense management, and financial reports.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'AIAssistant - Personal Productivity Bot',
      description: 'AI-powered personal assistant that integrates with email, calendar, and task managers. Natural language processing for scheduling and reminders.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 13,
    },
    {
      name: 'CommunityForum - Discussion Platform',
      description: 'Modern forum software with real-time updates, rich text editing, reputation system, and moderation tools. Mobile apps and API available.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 8,
    },
    {
      name: 'PhotoEditor - Web-Based Image Editor',
      description: 'Professional photo editing tool that runs in the browser. Filters, adjustments, layers, and AI-powered features. Export to multiple formats.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 11,
    },
    {
      name: 'QuizMaker - Interactive Quiz Platform',
      description: 'Create and share interactive quizzes and assessments. Multiple question types, timed tests, automatic grading, and detailed analytics.',
      level: ProjectLevel.BEGINNER,
      volunteersNeeded: 5,
    },
    {
      name: 'RemoteWork - Virtual Office Platform',
      description: 'Virtual office environment for remote teams with spatial audio, screen sharing, virtual whiteboards, and casual encounter zones.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 14,
    },
    {
      name: 'BookClub - Reading Community',
      description: 'Social platform for book lovers to discuss books, join reading clubs, and track reading progress. Author Q&As and book recommendations.',
      level: ProjectLevel.INTERMEDIATE,
      volunteersNeeded: 7,
    },
    {
      name: 'APIMarketplace - Developer API Hub',
      description: 'Marketplace for discovering and consuming APIs. API testing tools, documentation, usage analytics, and monetization for API providers.',
      level: ProjectLevel.ADVANCED,
      volunteersNeeded: 12,
    },
  ];

  const statuses = [
    ProjectStatus.ACTIVE,
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.DRAFT,
    ProjectStatus.COMPLETED,
  ];

  const createdProjects: Project[] = [];

  // Create 50 projects
  for (let i = 0; i < 50; i++) {
    const template = projectTemplates[i];
    const owner = getRandomElement(projectOwners);
    const status = getRandomElement(statuses);
    const isVerified = Math.random() > 0.3; // 70% verified

    const startDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 3);

    const projectData = {
      name: template.name,
      description: template.description,
      creator: owner,
      status: status,
      level: template.level,
      volunteersNeeded: template.volunteersNeeded,
      startDate: startDate,
      endDate: endDate,
      isVerified: isVerified,
      verifiedBy: isVerified ? adminUser?.id : undefined,
      links: {
        github: `https://github.com/portfoliohub/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        ...(Math.random() > 0.5 && { website: `https://${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.demo` }),
        ...(Math.random() > 0.7 && { figma: `https://figma.com/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` }),
      },
    };

    const project = projectRepository.create(projectData);
    const savedProject = await projectRepository.save(project);
    createdProjects.push(savedProject);
    console.log(`✓ Created project: ${project.name}`);
  }

  // Assign categories to projects
  console.log('\n📂 Assigning categories to projects...');
  for (const project of createdProjects) {
    const categoriesToAssign = getRandomElements(allCategories, Math.floor(Math.random() * 3) + 1);
    
    for (const category of categoriesToAssign) {
      const projectCategory = projectCategoryRepository.create({
        projectId: project.id,
        categoryId: category.id,
      });
      await projectCategoryRepository.save(projectCategory);
    }
  }
  console.log('✅ Categories assigned');

  // Assign skills to projects
  console.log('\n🛠️  Assigning skills to projects...');
  for (const project of createdProjects) {
    const skillsToAssign = getRandomElements(allSkills, Math.floor(Math.random() * 8) + 3);
    
    for (const skill of skillsToAssign) {
      const projectSkill = projectSkillRepository.create({
        projectId: project.id,
        skillId: skill.id,
        isMandatory: Math.random() > 0.6, // 40% mandatory
      });
      await projectSkillRepository.save(projectSkill);
    }
  }
  console.log('✅ Skills assigned');

  // Assign mentors to projects
  console.log('\n👨‍🏫 Assigning mentors to projects...');
  let totalMentors = 0;
  if (mentors.length > 0) {
    for (const project of createdProjects) {
      // Skip some projects (not all need mentors)
      if (Math.random() > 0.7) continue;

      const mentorsToAssign = getRandomElements(mentors, Math.floor(Math.random() * 2) + 1);
      
      for (const mentor of mentorsToAssign) {
        const mentorStatuses = [
          MentorStatus.ACTIVE,
          MentorStatus.APPROVED,
          MentorStatus.PENDING,
        ];
        
        const projectMentor = projectMentorRepository.create({
          projectId: project.id,
          userId: mentor.id,
          invitedBy: project.creatorId,
          status: getRandomElement(mentorStatuses),
          expertiseAreas: getRandomElements(
            ['Backend', 'Frontend', 'Mobile', 'DevOps', 'UI/UX', 'Data Science', 'Security'],
            Math.floor(Math.random() * 3) + 1
          ),
          applicationMessage: 'Excited to mentor this project and help the team succeed!',
        });
        await projectMentorRepository.save(projectMentor);
        totalMentors++;
      }
    }
  }
  console.log(`✅ Assigned ${totalMentors} mentors`);

  // Assign volunteers to projects
  console.log('\n🙋 Assigning volunteers to projects...');
  let totalVolunteers = 0;
  if (volunteers.length > 0) {
    for (const project of createdProjects) {
      // More volunteers for active projects
      const maxVolunteers = project.status === ProjectStatus.ACTIVE 
        ? Math.min(project.volunteersNeeded, volunteers.length)
        : Math.floor(project.volunteersNeeded * 0.6);

      const volunteersToAssign = getRandomElements(volunteers, Math.floor(Math.random() * maxVolunteers) + 1);
      
      for (const volunteer of volunteersToAssign) {
        const volunteerStatuses = [
          VolunteerStatus.ACTIVE,
          VolunteerStatus.APPROVED,
          VolunteerStatus.PENDING,
        ];
        
        const projectVolunteer = projectVolunteerRepository.create({
          projectId: project.id,
          userId: volunteer.id,
          invitedBy: Math.random() > 0.5 ? project.creatorId : undefined,
          status: getRandomElement(volunteerStatuses),
          applicationMessage: 'I would love to contribute to this project and learn new skills!',
          contributionScore: Math.floor(Math.random() * 500),
          tasksCompleted: Math.floor(Math.random() * 20),
        });
        await projectVolunteerRepository.save(projectVolunteer);
        totalVolunteers++;
      }
    }
  }
  console.log(`✅ Assigned ${totalVolunteers} volunteers`);

  console.log(`\n✅ Successfully seeded ${createdProjects.length} projects with related data!`);
  console.log(`   - Projects: ${createdProjects.length}`);
  console.log(`   - Mentors assigned: ${totalMentors}`);
  console.log(`   - Volunteers assigned: ${totalVolunteers}`);
};
