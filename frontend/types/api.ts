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

export interface Position {
    id: number;
    name: string;
    description: string;
}

export interface StartInterviewRequest {
    positionId: number;
    resumeId?: number | null;
}

export interface Question {
    id: number;
    text: string;
    category: string;
    orderNo: number;
}

export interface StartInterviewResponse {
    sessionId?: number;
    id?: number;
    interviewSessionId?: number;
    interviewId?: number;
    positionName: string;
    resumeFileName: string | null;
    questions: Question[];
}

export interface InterviewQuestion {
    id: number;
    text: string;
    category: string;
    orderNo: number;
}

export interface RawInterviewQuestion {
    id?: number;
    questionId?: number;
    text?: string;
    questionText?: string;
    title?: string;
    category?: string;
    questionCategory?: string;
    orderNo?: number;
    orderNumber?: number;
    order?: number;
}

export interface InterviewSessionDetail {
    sessionId: number;
    positionName: string;
    resumeFileName: string | null;
    questions: InterviewQuestion[];
}

export interface RawInterviewSessionDetail {
    sessionId?: number;
    id?: number;
    interviewSessionId?: number;
    interviewId?: number;
    positionName?: string;
    resumeFileName?: string | null;
    questions?: RawInterviewQuestion[];
}

export interface SubmitAnswerRequest {
    questionId: number;
    userAnswer: string;
}

export interface SubmitAnswerResponse {
    questionId: number;
    userAnswer: string;
    score: number;
    feedback: string;
}

export interface InterviewSessionDetail {
    sessionId: number;
    positionName: string;
    resumeFileName: string | null;
    questions: InterviewQuestion[];
}

export interface SubmitAnswerRequest {
    questionId: number;
    userAnswer: string;
}

export interface SubmitAnswerResponse {
    questionId: number;
    userAnswer: string;
    score: number;
    feedback: string;
}

export interface CategoryPerformance {
    category: string;
    averageScore: number;
}

export interface InterviewResult {
    sessionId: number;
    positionName: string;
    totalScore: number;
    generalEvaluation: string;
    strongAreas: string[];
    improvementAreas: string[];
    studyRecommendations: string[];
    categoryPerformances: CategoryPerformance[];
}

export interface InterviewSessionSummary {
    sessionId: number;
    positionName: string;
    resumeFileName: string | null;
    startedAt: string;
    completedAt: string | null;
    totalScore: number | null;
    status: string;
}

export interface RawInterviewSessionSummary {
    sessionId?: number;
    id?: number;
    interviewSessionId?: number;
    interviewId?: number;
    positionName?: string;
    resumeFileName?: string | null;
    startedAt?: string;
    startDate?: string;
    createdAt?: string;
    completedAt?: string | null;
    completedDate?: string | null;
    totalScore?: number | null;
    score?: number | null;
    status?: string;
}