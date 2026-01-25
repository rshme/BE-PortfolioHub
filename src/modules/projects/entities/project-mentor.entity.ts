import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MentorStatus } from '../../../common/enums/mentor-status.enum';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';

@Entity('project_mentors')
export class ProjectMentor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.mentors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.mentorProjects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by' })
  inviter?: User;

  @Column({ type: 'text', nullable: true, name: 'application_message' })
  applicationMessage?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'expertise_areas' })
  expertiseAreas?: string[];

  @Column({
    type: 'enum',
    enum: MentorStatus,
    default: MentorStatus.PENDING,
  })
  status: MentorStatus;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt?: Date;
}
