import { Milestone } from '../entities/milestone.entity';
import { Task } from '../../tasks/entities/task.entity';

export interface MilestoneWithStatistics extends Omit<Milestone, 'tasks'> {
  taskCount: number;
  completedTaskCount: number;
  completionPercentage: number;
  tasks?: Task[];
}

export interface MilestoneStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionPercentage: number;
}
