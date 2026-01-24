import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReportStatus } from '../../../common/enums/report-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User, (user) => user.reportsCreated, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'reported_user_id', nullable: true })
  reportedUserId?: string;

  @ManyToOne(() => User, (user) => user.reportsAgainst, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser?: User;

  @Column({ name: 'reported_project_id', nullable: true })
  reportedProjectId?: string;

  @ManyToOne('Project', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reported_project_id' })
  reportedProject?: any;

  @Column({ length: 255 })
  reason: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;
}
