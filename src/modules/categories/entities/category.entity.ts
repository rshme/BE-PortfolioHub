import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProjectCategory } from '../../projects/entities/project-category.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(
    () => ProjectCategory,
    (projectCategory) => projectCategory.category,
  )
  projects: ProjectCategory[];

  @OneToMany('UserInterest', 'category')
  userInterests: any[];
}
