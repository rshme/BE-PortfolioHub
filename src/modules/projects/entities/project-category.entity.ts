import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_categories')
export class ProjectCategory {
  @PrimaryColumn({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @PrimaryColumn({ name: 'category_id' })
  categoryId: string;

  @ManyToOne('Category', 'projects', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: any;
}
