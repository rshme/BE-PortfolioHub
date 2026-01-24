import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BadgeRarity } from '../../../common/enums/badge-rarity.enum';
import { UserBadge } from '../../users/entities/user-badge.entity';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'icon_url', nullable: true })
  iconUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  criteria?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: BadgeRarity,
    default: BadgeRarity.COMMON,
  })
  rarity: BadgeRarity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  userBadges: UserBadge[];
}
