import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ProjectStatus } from '../../../common/enums/project-status.enum';
import { ProjectLevel } from '../../../common/enums/project-level.enum';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdProjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectLevel,
    default: ProjectLevel.BEGINNER,
  })
  level: ProjectLevel;

  @Column({ name: 'volunteers_needed', type: 'int', default: 0 })
  volunteersNeeded: number;

  @Column({ name: 'volunteer_count', type: 'int', default: 0 })
  volunteerCount: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  links?: Record<string, string>;

  @Column({ type: 'text', nullable: true, array: true })
  images?: string[];

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl?: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany('ProjectVolunteer', 'project')
  volunteers: any[];

  @OneToMany('ProjectMentor', 'project')
  mentors: any[];

  @OneToMany('Task', 'project')
  tasks: any[];

  @OneToMany('Milestone', 'project')
  milestones: any[];

  @OneToMany('ProjectCategory', 'project')
  categories: any[];

  @OneToMany('ProjectSkill', 'project')
  skills: any[];
}
