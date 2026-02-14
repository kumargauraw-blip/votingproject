
export interface Project {
  id: string;
  presenterName: string;
  projectName: string;
  createdAt: number;
}

export interface Vote {
  voterName: string;
  projectId: string;
  presentationScore: number; // 0-30
  productScore: number;      // 0-45
  creativityScore: number;   // 0-25
  totalScore: number;
  timestamp: number;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  votes: Vote[];
  isWinnerAnnounced: boolean;
}

export type ViewMode = 'HOME' | 'ADMIN' | 'VOTING' | 'WINNERS';
