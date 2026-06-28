# AI Interview Coach - Backend

AI Interview Coach is an ASP.NET Core Web API project that helps users prepare for technical interviews. The system allows users to register, log in, upload resumes, analyze resume content, generate personalized interview questions, evaluate answers, and track performance through a dashboard.

## Features

- User registration and login
- JWT-based authentication and authorization
- Standard API response structure
- Position management
- Resume upload with PDF/DOCX support
- Resume text extraction
- Resume-based skill analysis
- Personalized interview question generation
- CV-based and behavioral interview questions
- Smart answer scoring and feedback
- Unknown answer detection
- Interview result analysis
- Category-based performance tracking
- Dashboard with progress insights
- Request validation for core endpoints

## Technologies

- ASP.NET Core Web API
- Entity Framework Core
- SQL Server LocalDB
- JWT Authentication
- Layered Architecture
- Swagger / OpenAPI
- PDF and DOCX text extraction

## Main API Modules

### Auth

- `POST /api/Auth/register`
- `POST /api/Auth/login`
- `GET /api/Auth/profile`

### Positions

- `GET /api/Positions`
- `POST /api/Positions/seed`

### Resumes

- `POST /api/Resumes/upload`
- `GET /api/Resumes/my-resumes`
- `GET /api/Resumes/{resumeId}/analysis`

### Interviews

- `POST /api/Interviews/start`
- `POST /api/Interviews/answer`
- `GET /api/Interviews/{sessionId}/result`
- `GET /api/Interviews/my-sessions`

### Dashboard

- `GET /api/Dashboard`

## Project Architecture

The project follows a layered architecture:

- `Domain`: Entity classes
- `Application`: DTOs and service interfaces
- `Infrastructure`: Database context and service implementations
- `API`: Controllers, authentication, dependency injection, and configuration

## Current Status

Backend MVP is completed. The API supports the full user flow from authentication to resume analysis, personalized interview generation, answer evaluation, result analysis, and dashboard tracking.
