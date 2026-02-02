import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VOLUNTEER,
  })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'social_links' })
  socialLinks?: Record<string, string>;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @ManyToOne('Organization', 'members', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'organization_id' })
  organization?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany('Project', 'creator')
  createdProjects: any[];

  @OneToMany('ProjectVolunteer', 'user')
  volunteerProjects: any[];

  @OneToMany('ProjectMentor', 'user')
  mentorProjects: any[];

  @OneToMany('Task', 'assignedTo')
  assignedTasks: any[];

  @OneToMany('Task', 'createdBy')
  createdTasks: any[];

  @OneToMany('TaskComment', 'user')
  taskComments: any[];

  @OneToMany('UserBadge', 'user')
  badges: any[];

  @OneToMany('Message', 'sender')
  sentMessages: any[];

  @OneToMany('Message', 'receiver')
  receivedMessages: any[];

  @OneToMany('UserSkill', 'user')
  skills: any[];

  @OneToMany('UserInterest', 'user')
  interests: any[];

  @OneToMany('Notification', 'user')
  notifications: any[];

  @OneToMany('ActivityLog', 'user')
  activityLogs: any[];

  @OneToMany('Report', 'reporter')
  reportsCreated: any[];

  @OneToMany('Report', 'reportedUser')
  reportsAgainst: any[];

  @OneToMany('Testimonial', 'user')
  testimonials: any[];
}
