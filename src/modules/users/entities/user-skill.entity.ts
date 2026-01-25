import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_skills')
export class UserSkill {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ name: 'skill_id' })
  skillId: string;

  @ManyToOne('Skill', 'userSkills', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: any;
}
