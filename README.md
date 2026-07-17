<div align="center">

# 🤖 AI Interview Coach

### AI-powered interview preparation platform  
### Yapay zeka destekli mülakat hazırlık platformu

<br />

<img src="https://img.shields.io/badge/ASP.NET%20Core-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" />
<img src="https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" />

<br />
<br />

A full-stack AI interview coach that generates questions, evaluates answers, rewrites responses, creates personalized study plans, and exports interview reports as PDF.

CV’ye, hedef pozisyona ve mülakat türüne göre soru üreten, cevapları değerlendiren, daha güçlü cevap önerileri sunan, kişisel gelişim planı oluşturan ve PDF rapor dışa aktarabilen full-stack yapay zeka mülakat koçu.

</div>

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Proje Hakkında](#-proje-hakkında)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Main Modules](#-main-modules)
- [API Overview](#-api-overview)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Security Notes](#-security-notes)
- [Deployment Plan](#-deployment-plan)
- [What I Learned](#-what-i-learned)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

---

## 🌍 About the Project

**AI Interview Coach** is a full-stack AI-powered interview preparation platform.  
It allows users to upload their resume, select a target position, start interview sessions, answer generated questions, receive AI-based evaluation, review performance analytics, improve answers with AI, and export interview results as a PDF report.

The platform supports different interview modes such as:

- Technical
- Behavioral
- Role-based
- SQL
- Coding-oriented questions

The goal of this project is to help users prepare for interviews in a more personalized, structured, and measurable way.

---

## 🇹🇷 Proje Hakkında

**AI Interview Coach**, kullanıcıların CV’sine, hedef pozisyonuna ve seçtiği mülakat türüne göre kişiselleştirilmiş mülakat pratiği yapmasını sağlayan yapay zeka destekli bir web uygulamasıdır.

Kullanıcı sisteme CV yükleyebilir, hedef pozisyon seçebilir, mülakat başlatabilir, gelen soruları cevaplayabilir ve her cevap için skor, geri bildirim, güçlü yönler, gelişim alanları ve daha iyi cevap örnekleri alabilir.

Uygulama ayrıca:

- AI ile daha güçlü cevap oluşturma
- Kişisel gelişim planı üretme
- Dashboard üzerinden performans takibi
- PDF rapor dışa aktarma

özelliklerini destekler.

---

## ✨ Features

### 🇹🇷 Türkçe Özellikler

- 🔐 Kullanıcı kayıt ve giriş sistemi
- 🔑 JWT tabanlı kimlik doğrulama
- 📄 CV yükleme ve CV analizi
- 🎯 Hedef pozisyona göre mülakat başlatma
- 🤖 AI destekli soru üretimi
- 🧠 Teknik, davranışsal, role-based, SQL ve kodlama odaklı soru türleri
- 📝 Kullanıcı cevaplarını değerlendirme
- 📊 Skor, feedback, güçlü yönler ve gelişim alanları
- ✨ AI ile daha güçlü cevap oluşturma
- 📚 Kişisel gelişim planı oluşturma
- ✅ Gelişim planı görevlerini tamamlama / geri alma
- 📈 Dashboard üzerinden performans takibi
- 🕘 Geçmiş mülakat oturumlarını görüntüleme
- 🗑️ CV ve mülakat oturumu silme
- 📥 Mülakat sonucunu PDF rapor olarak indirme
- 🌙 Dark / Light mode desteği
- 📱 Responsive ve modern arayüz

### 🇬🇧 English Features

- 🔐 User registration and login
- 🔑 JWT-based authentication
- 📄 Resume upload and resume analysis
- 🎯 Interview session creation by target position
- 🤖 AI-powered question generation
- 🧠 Technical, behavioral, role-based, SQL, and coding question types
- 📝 Answer evaluation and scoring
- 📊 Feedback, strong points, and improvement points
- ✨ AI-powered answer rewriting
- 📚 Personalized study plan generation
- ✅ Study plan task completion tracking
- 📈 Performance dashboard
- 🕘 Interview history tracking
- 🗑️ Resume and interview session deletion
- 📥 PDF report export
- 🌙 Dark / Light mode support
- 📱 Responsive modern UI

---

## 🛠️ Tech Stack

### Backend

| Technology | Description |
|---|---|
| ASP.NET Core 8 Web API | REST API backend |
| Entity Framework Core | ORM and database operations |
| SQL Server / LocalDB | Relational database |
| JWT Authentication | Secure user authentication |
| Layered Architecture | Domain, Application, Infrastructure, API layers |
| Gemini AI | AI question generation, answer evaluation, answer rewrite |
| Swagger | API documentation and testing |

### Frontend

| Technology | Description |
|---|---|
| Next.js | React-based frontend framework |
| React | UI development |
| TypeScript | Type-safe frontend development |
| Tailwind CSS | Modern responsive styling |
| Axios | API communication |
| next-themes | Dark / light mode |
| Framer Motion | UI animations |
| jsPDF | PDF report export |
| html2canvas | HTML-to-canvas PDF rendering |

### Database

| Technology | Description |
|---|---|
| SQL Server | Main database |
| EF Core Migrations | Database schema versioning |

---

## 🖼️ Screenshots

> Screenshots can be added after deployment or final UI capture.

```txt
screenshots/
├── dashboard.png
├── start-interview.png
├── interview-session.png
├── result-page.png
├── study-plan.png
├── resume-list.png
└── resume-analysis.png
```

### Suggested Screenshot Areas

| Page | Description |
|---|---|
| Dashboard | Performance summary and AI insights |
| Resume Page | Resume upload and list |
| Resume Analysis | Skill extraction and analysis |
| Start Interview | Interview configuration |
| Interview Session | Question and answer flow |
| Result Page | Score, feedback, and AI report |
| Study Plan | Personalized development plan |

---

## 📁 Project Structure

```txt
AIInterviewCoach
├── backend
│   ├── AIInterviewCoach
│   │   ├── Controllers
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   ├── AIInterviewCoach.Application
│   │   ├── DTOs
│   │   ├── Interfaces
│   │   └── Services
│   │
│   ├── AIInterviewCoach.Domain
│   │   └── Entities
│   │
│   └── AIInterviewCoach.Infrastructure
│       ├── Data
│       ├── Services
│       └── Settings
│
└── frontend
    ├── app
    │   ├── dashboard
    │   ├── interviews
    │   ├── login
    │   ├── register
    │   ├── resumes
    │   ├── settings
    │   └── study-plan
    │
    ├── components
    ├── lib
    ├── types
    └── package.json
```

---

## 🧩 Main Modules

### 🔐 Authentication

The authentication module allows users to register, log in, and access protected endpoints using JWT tokens.

**Key features:**

- Register
- Login
- Token-based access
- Protected API endpoints
- Account deletion

---

### 📄 Resume Management

Users can upload resumes and view resume analysis results. Resume data is used to generate more personalized interview questions.

**Key features:**

- Resume upload
- Resume list
- Resume analysis
- Resume deletion
- Resume-based interview personalization

---

### 🎯 Interview Session

Users can start a new interview by selecting:

- Target position
- Resume
- Difficulty level
- Interview mode
- Question count
- Programming language when needed

The system generates questions and manages the interview flow.

---

### 🤖 AI Question Generation

The system generates interview questions based on:

- Selected position
- Interview mode
- Difficulty
- Resume content
- Programming language
- Question count

Supported question types include:

- Technical
- Behavioral
- Role-based
- SQL
- Coding-oriented

---

### 🧠 AI Answer Evaluation

User answers are evaluated by AI or fallback rule-based logic.

The result includes:

- Score
- Feedback
- Better answer example
- Strong points
- Improvement points

---

### ✨ AI Answer Rewrite

Users can request a stronger version of their answer.

The system rewrites the answer in a more:

- Professional
- Structured
- Clear
- Interview-friendly

way.

---

### 📚 Study Plan

The system creates a personalized study plan according to the user’s interview performance.

The study plan includes:

- Strong areas
- Weak areas
- Technical focus topics
- Communication focus topics
- Weekly tasks
- Task completion tracking
- Regeneration option

---

### 📈 Dashboard

The dashboard summarizes:

- Total interviews
- Completed interviews
- Average score
- Completion rate
- Strongest category
- Weakest category
- Recent interview sessions
- Position summaries
- AI coach insights

---

### 📥 PDF Report Export

Users can download their interview result as a PDF report.

The report includes:

- Position
- Session ID
- Average score
- Answered question count
- General evaluation
- Strong areas
- Improvement areas
- Study recommendations
- Category performance
- Question-based analysis

---

## 🔌 API Overview

### Authentication

```txt
POST   /api/Auth/register
POST   /api/Auth/login
DELETE /api/Auth/delete-account
```

### Resume

```txt
POST   /api/Resumes/upload
GET    /api/Resumes
GET    /api/Resumes/{resumeId}/analysis
DELETE /api/Resumes/{resumeId}
```

### Interview

```txt
POST   /api/Interviews/start
POST   /api/Interviews/answer
GET    /api/Interviews/{sessionId}/result
GET    /api/Interviews/my-sessions
DELETE /api/Interviews/{sessionId}
POST   /api/Interviews/rewrite-answer
```

### Study Plan

```txt
GET  /api/StudyPlan
POST /api/StudyPlan/tasks/{taskId}/complete
POST /api/StudyPlan/tasks/{taskId}/uncomplete
POST /api/StudyPlan/regenerate
```

### Dashboard

```txt
GET /api/Dashboard
```

---

## 🚀 Local Setup

### Prerequisites

Make sure you have installed:

- .NET 8 SDK
- Node.js
- SQL Server / SQL Server LocalDB
- Visual Studio or Visual Studio Code
- Git

---

### Backend Setup

```bash
cd backend
dotnet restore
dotnet build
cd AIInterviewCoach
dotnet run
```

Backend runs on:

```txt
http://localhost:5062
```

Swagger:

```txt
http://localhost:5062/swagger
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:3000
```

---

## ⚙️ Environment Variables

### Frontend

Create a `.env.local` file inside the `frontend` folder:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5062/api
```

---

### Backend

Use `appsettings.Development.json` locally.  
Do not commit this file.

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_LOCAL_CONNECTION_STRING"
  },
  "Jwt": {
    "Key": "YOUR_SECRET_KEY",
    "Issuer": "AIInterviewCoach",
    "Audience": "AIInterviewCoach"
  },
  "AiProvider": {
    "Provider": "Gemini",
    "ApiKey": "YOUR_GEMINI_API_KEY",
    "Model": "gemini-3.5-flash",
    "Endpoint": ""
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000"
    ]
  }
}
```

---

## 🔒 Security Notes

- Never commit API keys.
- Never commit `appsettings.Development.json`.
- Store JWT keys securely.
- Store production connection strings as environment variables.
- Configure CORS only for allowed frontend URLs.
- Use HTTPS in production.
- Keep `.env.local` ignored.

Recommended `.gitignore` entries:

```gitignore
backend/AIInterviewCoach/appsettings.Development.json
.env
.env.local
.env.*.local
```

---

## ☁️ Deployment Plan

Recommended deployment architecture:

```txt
Frontend  → Vercel
Backend   → Azure App Service
Database  → Azure SQL Database
```

### Production Environment Variables

Frontend:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-URL/api
```

Backend:

```txt
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
AiProvider__Provider
AiProvider__ApiKey
AiProvider__Model
AiProvider__Endpoint
Cors__AllowedOrigins__0
```

Example:

```txt
Cors__AllowedOrigins__0=https://YOUR-FRONTEND-URL
```

---

## 🧠 What I Learned

### 🇹🇷 Türkçe

Bu projede ASP.NET Core Web API, Entity Framework Core, JWT authentication, SQL Server, Next.js, TypeScript, Tailwind CSS ve AI entegrasyonu kullanarak uçtan uca çalışan bir mülakat koçu uygulaması geliştirdim.

Proje boyunca:

- Katmanlı mimari
- REST API tasarımı
- Frontend-backend entegrasyonu
- JWT tabanlı kimlik doğrulama
- Kullanıcı bazlı veri yönetimi
- Entity Framework Core migration yönetimi
- AI tabanlı soru üretimi
- AI tabanlı cevap değerlendirme
- AI ile cevap iyileştirme
- Dashboard tasarımı
- PDF rapor dışa aktarma
- Deployment hazırlığı

konularında deneyim kazandım.

---

### 🇬🇧 English

In this project, I developed a full-stack AI-powered interview coach application using ASP.NET Core Web API, Entity Framework Core, JWT authentication, SQL Server, Next.js, TypeScript, Tailwind CSS, and AI integration.

During the project, I gained hands-on experience in:

- Layered architecture
- REST API design
- Frontend-backend integration
- JWT-based authentication
- User-based data management
- Entity Framework Core migrations
- AI-powered question generation
- AI-powered answer evaluation
- AI-based answer rewriting
- Dashboard design
- PDF report export
- Deployment preparation

---

## 🎤 How I Explain This Project in an Interview

### Turkish Version

Bu proje, kullanıcıların CV’sine ve hedef pozisyonuna göre kişiselleştirilmiş mülakat pratiği yapabildiği yapay zeka destekli bir web uygulamasıdır.

Backend tarafında ASP.NET Core Web API, Entity Framework Core, SQL Server ve JWT authentication kullandım. Frontend tarafında ise Next.js, TypeScript, Tailwind CSS ve Axios ile responsive bir arayüz geliştirdim.

Kullanıcı CV yükledikten sonra hedef pozisyon seçerek mülakat başlatabiliyor. Sistem AI destekli sorular üretiyor, kullanıcının cevaplarını değerlendiriyor, skor, feedback, güçlü yönler ve gelişim alanları döndürüyor. Ayrıca kullanıcı cevaplarını AI ile daha profesyonel hale getirebiliyor ve mülakat sonucunu PDF rapor olarak indirebiliyor.

Bu projede özellikle frontend-backend entegrasyonu, JWT ile güvenli endpoint yönetimi, kullanıcı bazlı veri ilişkileri, AI servis entegrasyonu ve raporlama modülleri üzerinde çalıştım.

---

### English Version

This project is an AI-powered interview preparation platform that allows users to practice interviews based on their resume and target position.

On the backend, I used ASP.NET Core Web API, Entity Framework Core, SQL Server, and JWT authentication. On the frontend, I developed a responsive user interface using Next.js, TypeScript, Tailwind CSS, and Axios.

After uploading a resume, users can start an interview session by selecting a target position. The system generates AI-powered questions, evaluates user answers, returns scores, feedback, strong points, and improvement areas. Users can also rewrite their answers with AI and export the interview result as a PDF report.

In this project, I focused on frontend-backend integration, secure JWT-based endpoints, user-based data management, AI service integration, and report generation.

---

## 🗺️ Future Improvements

- 🎙️ Voice-based interview practice
- 🗣️ Speech-to-text answer input
- 🧑‍💼 Admin panel
- 📊 More advanced analytics dashboard
- 🌍 Multi-language interview support
- 🧩 Role-specific interview templates
- 📧 Email report delivery
- 📱 Mobile application version
- 🧠 More advanced AI scoring logic
- 📌 Interview calendar and reminder system

---

## 👩‍💻 Author

<div align="center">

### Begüm Yaren ÖZTÜRK

Computer Engineer  
Full-Stack Developer Candidate  
AI Interview Coach Project

<br />

<img src="https://img.shields.io/badge/Backend-ASP.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
<img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/Database-SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" />

</div>

---

## ⭐ Final Note

This project was built as a full-stack AI-powered interview preparation system.  
It combines backend development, frontend development, database management, authentication, AI integration, reporting, and deployment preparation in a single real-world application.

---

<div align="center">

### 🤖 AI Interview Coach  
#### Built with ASP.NET Core, Next.js, SQL Server, and AI integration.

</div>