IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260617232048_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260617232048_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260617232048_InitialCreate', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE TABLE [Positions] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Positions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE TABLE [InterviewSessions] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [PositionId] int NOT NULL,
        [StartedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        [TotalScore] int NULL,
        CONSTRAINT [PK_InterviewSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InterviewSessions_Positions_PositionId] FOREIGN KEY ([PositionId]) REFERENCES [Positions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_InterviewSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE TABLE [Questions] (
        [Id] int NOT NULL IDENTITY,
        [InterviewSessionId] int NOT NULL,
        [QuestionText] nvarchar(max) NOT NULL,
        [Difficulty] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Questions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Questions_InterviewSessions_InterviewSessionId] FOREIGN KEY ([InterviewSessionId]) REFERENCES [InterviewSessions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE TABLE [Answers] (
        [Id] int NOT NULL IDENTITY,
        [QuestionId] int NOT NULL,
        [UserAnswer] nvarchar(max) NOT NULL,
        [Score] int NULL,
        [Feedback] nvarchar(max) NOT NULL,
        [AnswerAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Answers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Answers_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Answers_QuestionId] ON [Answers] ([QuestionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE INDEX [IX_InterviewSessions_PositionId] ON [InterviewSessions] ([PositionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE INDEX [IX_InterviewSessions_UserId] ON [InterviewSessions] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    CREATE INDEX [IX_Questions_InterviewSessionId] ON [Questions] ([InterviewSessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260619215721_AddInterviewEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260619215721_AddInterviewEntities', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620231615_FixAnswerAnsweredAtColumn'
)
BEGIN
    EXEC sp_rename N'[Answers].[AnswerAt]', N'AnsweredAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620231615_FixAnswerAnsweredAtColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260620231615_FixAnswerAnsweredAtColumn', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623000146_AddResumeEntity'
)
BEGIN
    CREATE TABLE [Resumes] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FilePath] nvarchar(max) NOT NULL,
        [ContentType] nvarchar(max) NOT NULL,
        [UploadedAt] datetime2 NOT NULL,
        [ExtractedText] nvarchar(max) NULL,
        CONSTRAINT [PK_Resumes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Resumes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623000146_AddResumeEntity'
)
BEGIN
    CREATE INDEX [IX_Resumes_UserId] ON [Resumes] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623000146_AddResumeEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260623000146_AddResumeEntity', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260710232544_AddBetterAnswerExampleToAnswer'
)
BEGIN
    ALTER TABLE [Answers] ADD [BetterAnswerExample] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260710232544_AddBetterAnswerExampleToAnswer'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260710232544_AddBetterAnswerExampleToAnswer', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260712221440_AddAiEvaluationPointsToAnswer'
)
BEGIN
    ALTER TABLE [Answers] ADD [ImprovementPointsJson] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260712221440_AddAiEvaluationPointsToAnswer'
)
BEGIN
    ALTER TABLE [Answers] ADD [StrongPointsJson] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260712221440_AddAiEvaluationPointsToAnswer'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260712221440_AddAiEvaluationPointsToAnswer', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260713234353_AddExpectedAnswerGuideToQuestion'
)
BEGIN
    ALTER TABLE [Questions] ADD [ExpectedAnswerGuide] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260713234353_AddExpectedAnswerGuideToQuestion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260713234353_AddExpectedAnswerGuideToQuestion', N'8.0.28');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716005948_AddStudyPlanTaskProgress'
)
BEGIN
    CREATE TABLE [StudyPlanTaskProgresses] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Day] nvarchar(max) NOT NULL,
        [Focus] nvarchar(max) NOT NULL,
        [Task] nvarchar(max) NOT NULL,
        [PracticeMode] nvarchar(max) NOT NULL,
        [IsCompleted] bit NOT NULL,
        [CompletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StudyPlanTaskProgresses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StudyPlanTaskProgresses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716005948_AddStudyPlanTaskProgress'
)
BEGIN
    CREATE INDEX [IX_StudyPlanTaskProgresses_UserId] ON [StudyPlanTaskProgresses] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716005948_AddStudyPlanTaskProgress'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260716005948_AddStudyPlanTaskProgress', N'8.0.28');
END;
GO

COMMIT;
GO

