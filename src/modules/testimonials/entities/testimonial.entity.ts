import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.testimonials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'author_name', length: 100 })
  authorName: string;

  @Column({ name: 'author_position', length: 150, nullable: true })
  authorPosition?: string;

  @Column({ name: 'author_company', length: 150, nullable: true })
  authorCompany?: string;

  @Column({ name: 'author_avatar_url', nullable: true })
  authorAvatarUrl?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ length: 100, nullable: true })
  relationship?: string;

  @Column({ name: 'project_context', length: 255, nullable: true })
  projectContext?: string;

  @Column({ type: 'boolean', default: true, name: 'is_visible' })
  isVisible: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
