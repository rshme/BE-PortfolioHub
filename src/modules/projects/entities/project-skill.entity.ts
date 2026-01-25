import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_skills')
export class ProjectSkill {
  @PrimaryColumn({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @PrimaryColumn({ name: 'skill_id' })
  skillId: string;

  @ManyToOne('Skill', 'projectSkills', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: any;

  @Column({ name: 'is_mandatory', type: 'boolean', default: false })
  isMandatory: boolean;
}
