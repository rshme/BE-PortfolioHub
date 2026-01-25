import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VolunteerStatus } from '../../../common/enums/volunteer-status.enum';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';

@Entity('project_volunteers')
export class ProjectVolunteer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.volunteers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.volunteerProjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by' })
  inviter?: User;

  @Column({ type: 'text', nullable: true, name: 'application_message' })
  applicationMessage?: string;

  @Column({
    type: 'enum',
    enum: VolunteerStatus,
    default: VolunteerStatus.PENDING,
  })
  status: VolunteerStatus;

  @Column({ name: 'contribution_score', type: 'int', default: 0 })
  contributionScore: number;

  @Column({ name: 'tasks_completed', type: 'int', default: 0 })
  tasksCompleted: number;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt?: Date;
}
