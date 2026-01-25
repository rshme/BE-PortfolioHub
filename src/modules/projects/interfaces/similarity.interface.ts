export interface SimilarityScore {
  projectId: string;
  projectName: string;
  similarityScore: number; // 0-1
  similarityPercentage: number; // 0-100
  matchingSkillsCount: number;
  totalProjectSkills: number;
  matchingSkills: string[];
}

export interface ProjectRecommendation extends SimilarityScore {
  project: any;
}
