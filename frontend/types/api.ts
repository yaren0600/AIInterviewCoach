export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface LoginResponse {
    token: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface DashboardRecentInterview {
    sessionId: number;
    positionName: string;
    startedAt: string;
    completedAt: string | null;
    totalScore: number | null;
    status: string;
}

export interface DashboardPositionSummary {
    positionName: string;
    interviewCount: number;
    averageScore: number | null;
}

//Bu interface backendden gelen dashboard datasının ana şekli 
export interface DashboardResponse {
    totalInterviews: number;
    completedInterviews: number;
    inProgressInterviews: number;
    averageScore: number | null;
    completionRate: number;
    strongestCategory: string;
    weakestCategory: string;
    latestRecommendation: string;
    recentInterviews: DashboardRecentInterview[];
    positionSummaries: DashboardPositionSummary[];
}

export interface Resume {
    id: number;
    fileName: string;
    filePath: string;
    contentType: string;
    uploadedAt: string;
    extractedText: string | null;
}

export interface ResumeAnalysis {
    resumeId: number;
    fileName: string;
    detectedSkills: string[];
    missingSkills: string[];
    suggestedPositions: string[];
    summary: string;
}
