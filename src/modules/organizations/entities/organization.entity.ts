import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100, nullable: true })
  industry?: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl?: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ type: 'int', name: 'employee_count', nullable: true })
  employeeCount?: number;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  foundedYear?: number;

  @Column({ type: 'jsonb', nullable: true, name: 'social_links' })
  socialLinks?: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  mission?: string;

  @Column({ type: 'text', nullable: true })
  vision?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany('User', 'organization')
  members: any[];
}
