import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('user_interests')
export class UserInterest {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.interests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.userInterests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
