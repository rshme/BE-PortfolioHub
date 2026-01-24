import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSkill } from '../../users/entities/user-skill.entity';
import { ProjectSkill } from '../../projects/entities/project-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true })
  icon?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => UserSkill, (userSkill) => userSkill.skill)
  userSkills: UserSkill[];

  @OneToMany(() => ProjectSkill, (projectSkill) => projectSkill.skill)
  projectSkills: ProjectSkill[];
}
