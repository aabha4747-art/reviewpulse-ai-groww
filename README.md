# ReviewPulse AI — Groww
### AI-Powered Customer Review Intelligence & Weekly Product Insights

**NextLeap Product Management Fellowship | Milestone 2**

ReviewPulse AI is a full-stack, AI-powered product intelligence platform designed to help product managers transform unstructured customer feedback into actionable insights, weekly product updates, and clear customer-facing explanations.

The project uses **Google Gemini AI** to analyze customer reviews, identify recurring pain points, generate product recommendations, and draft customer clarifications. It also demonstrates an **approval-gated workflow** using Google Docs and Gmail integrations.

---

## 1. Live Application

**Frontend (Vercel):**  
https://reviewpulse-ai-groww-c463mtmfj-aabha4747-arts-projects.vercel.app

**Backend (Render):**  
https://reviewpulse-ai-groww-api.onrender.com

**Backend Health Check:**  
https://reviewpulse-ai-groww-api.onrender.com/api/health

**GitHub Repository:**  
https://github.com/aabha4747-art/reviewpulse-ai-groww

> The prototype is an independent educational project inspired by customer feedback about Groww. It is not affiliated with or endorsed by Groww.

---

## 2. Problem Statement

Digital investment platforms receive large volumes of customer feedback through app reviews, public discussion platforms, and other channels.

For product managers, manually analyzing this feedback creates several challenges:

- Customer pain points are scattered across multiple sources.
- Repeated complaints can be difficult to identify.
- Product teams spend time manually categorizing feedback.
- Prioritizing recurring issues requires structured evidence.
- Customers may misunderstand brokerage fees and other charges.
- Preparing weekly product updates can be time-consuming.

**The opportunity:** Build an AI-powered system that converts customer reviews into structured product intelligence and actionable recommendations while keeping human approval in control of external actions.

---

## 3. Proposed Solution

ReviewPulse AI streamlines customer feedback analysis through six connected capabilities.

### 3.1 Customer Review Upload
Upload a CSV containing customer reviews, dates, source information, and ratings where available.

The backend validates the dataset and prepares the reviews for analysis.

### 3.2 AI-Powered Review Analysis
Google Gemini analyzes the uploaded reviews to identify:

- Up to five recurring customer feedback themes
- Three priority themes
- Supporting review IDs and evidence
- Customer sentiment distribution
- Recurring confusion related to fees or charges

### 3.3 AI Insights Dashboard
Review the themes and customer pain points in a structured interface to support product discovery and prioritization.

### 3.4 Weekly Product Pulse
Generate a concise weekly product update containing:

- Key customer feedback trends
- Priority product issues
- Supporting evidence
- Three actionable product recommendations

**Target length:** 250 words or fewer.

### 3.5 Fee Explainer
Generate a neutral, customer-friendly explanation addressing recurring fee-related confusion.

The intended output includes:

- Up to six concise explanation bullets
- Official supporting links
- A last-checked date
- Clear, non-promotional language

### 3.6 Approval-Gated Google Workflow
Demonstrate a simulated Model Context Protocol (MCP)-style workflow with human approval before external actions.

After approval, the system is designed to:

1. Append the product analysis and weekly update to a Google Doc.
2. Create a Gmail draft containing the weekly product pulse and customer clarification.
3. Leave the draft unsent for human review.

**Human-in-the-loop principle:** No email should be automatically sent.

---

## 4. Product Objectives

The project aims to:

1. Reduce manual effort in reviewing customer feedback.
2. Convert qualitative reviews into structured product insights.
3. Identify recurring customer pain points with supporting evidence.
4. Generate concise, actionable product updates.
5. Improve clarity around frequently misunderstood fees.
6. Demonstrate safe AI-assisted automation with human approval.

---

## 5. Target Users

**Primary users:** Product Managers and Associate Product Managers working on digital financial products.

**Secondary users:** Customer experience teams, product analysts, support operations teams, and business stakeholders.

### Core Jobs to Be Done

- When I receive many customer reviews, I want to identify the most common issues quickly so I can prioritize investigation.
- When preparing a weekly stakeholder update, I want an evidence-backed summary so I can communicate product problems and proposed actions.
- When customers repeatedly misunderstand charges, I want to draft a clear explanation grounded in official information.
- When AI prepares content for external systems, I want to approve the action before it is executed.

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| AI Model | Google Gemini |
| API Communication | Axios / REST APIs |
| File Upload | Multer |
| CSV Processing | csv-parse |
| Authentication for Google Integration | Google OAuth 2.0 |
| External Integrations | Google Docs API, Gmail API |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git and GitHub |

---

## 7. System Architecture

```text
Customer Review CSV
        |
        v
React + Vite Frontend
        |
        v
Node.js + Express Backend
        |
        +---- CSV Upload and Validation
        |
        +---- Google Gemini AI
        |          |
        |          +---- Theme Extraction
        |          +---- Sentiment Analysis
        |          +---- Weekly Product Pulse
        |          +---- Fee Explainer
        |
        v
Human Approval Gate
        |
        +---- Google Docs (Append Entry)
        |
        +---- Gmail (Create Draft Only)
```

The frontend handles user interactions and displays generated results. The backend validates inputs, communicates with Gemini, and coordinates Google integrations.

API credentials remain on the server rather than being exposed through frontend code.

---

## 8. Application Workflow

**Step 1 — Upload Reviews**

The user uploads a CSV containing customer review records.

**Step 2 — Analyze Reviews**

The backend sends validated review content to Google Gemini and checks the generated output against the uploaded dataset.

**Step 3 — Review AI Insights**

The application displays customer feedback themes, supporting evidence, and sentiment information.

**Step 4 — Generate Weekly Pulse**

The user generates a concise weekly product summary and proposed actions.

**Step 5 — Generate Fee Explainer**

The application drafts a customer clarification based on fee-related feedback and supporting sources.

**Step 6 — Approve Google Actions**

The user reviews the proposed content and explicitly approves the Google workflow.

**Step 7 — Save and Draft**

The approved content is appended to Google Docs and used to create a Gmail draft without automatically sending an email.

---

## 9. Review Dataset

The prototype uses a CSV dataset of 15 Groww-related customer feedback entries spanning August–October 2026.

### Expected CSV Structure

```csv
review_id,date,rating,review_text,source,source_url
GR001,2026-08-15,,Example customer feedback,Public review source,https://example.com
```

### Dataset Fields

| Field | Description |
|---|---|
| review_id | Unique identifier for each review |
| date | Review date in YYYY-MM-DD format |
| rating | Optional rating from 1 to 5 |
| review_text | Customer feedback text |
| source | Review source name |
| source_url | URL identifying the source |

### Data Integrity

The prototype dataset contains paraphrased feedback used for demonstration. Paraphrases must not be presented as verbatim customer quotations.

For a submission requiring authentic customer quotes, the dataset and generated evidence must be checked against the original public sources and replaced with exact wording where necessary.

Blank ratings are supported when a source does not provide a reliable numeric rating.

---

## 10. AI Analysis and Validation

ReviewPulse AI includes checks intended to improve the reliability of generated insights.

These include:

- Validating review IDs and review text.
- Supporting optional ratings.
- Rejecting duplicate review identifiers.
- Limiting the number of themes.
- Checking AI-generated review references against uploaded review IDs.
- Matching quoted text to the uploaded CSV.
- Calculating theme evidence counts from supporting review IDs.
- Checking sentiment totals against the review dataset.

**Important limitation:** Matching a quote to the CSV establishes consistency with the uploaded data, not authenticity against the original public source. External source verification remains necessary.

AI-generated recommendations are suggestions for product investigation, not confirmed diagnoses of Groww's internal systems.

---

## 11. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| POST | `/api/reviews/upload` | Upload and validate CSV |
| POST | `/api/reviews/analyze` | Generate AI review analysis |
| POST | `/api/reviews/pulse` | Generate weekly product pulse |
| POST | `/api/reviews/fee-explainer` | Generate customer fee explanation |
| Various | `/api/google/*` | Google OAuth and approval-related integration |

The Google integration exposes additional routes defined in the backend's Google approval module.

---

## 12. Local Setup and Installation

### Prerequisites

- Node.js and npm
- Git
- Google Gemini API key
- Google Cloud OAuth credentials for Google integrations

### Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd reviewpulse-ai-groww
```

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and configure the environment variables required by your backend.

At minimum, the Gemini integration requires:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Google integrations require additional OAuth configuration matching the variable names used in the backend.

Start the backend:

```bash
npm run dev
```

Backend URL:

`http://localhost:5000`

### Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend URL:

`http://localhost:5173`

For a production build, configure the frontend to use the deployed backend API URL.

---

## 13. Deployment

### Backend — Render

The Express backend is deployed as a Node.js web service.

**Configuration:**

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: Configured securely in Render

**Production API:**

https://reviewpulse-ai-groww-api.onrender.com

### Frontend — Vercel

The React frontend is deployed using Vercel.

**Configuration:**

- Root directory: `client`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

**Production application:**

https://reviewpulse-ai-groww-c463mtmfj-aabha4747-arts-projects.vercel.app

The backend CORS configuration allows the deployed frontend to communicate with the API.

Google OAuth redirect URLs and authorized origins must be configured for production before using the Google integration online.

---

## 14. Privacy and Security

- API keys and OAuth secrets must not be committed to GitHub.
- Backend credentials are managed through server-side environment variables.
- The application validates review input before analysis.
- AI-generated evidence is checked against the uploaded dataset.
- External Google actions require explicit approval.
- Gmail content is created as a draft rather than automatically sent.
- Public reviews should be handled in accordance with source permissions and applicable privacy requirements.

The prototype is intended for educational demonstration and is not a production-grade financial services system.

---

## 15. Success Metrics

The following metrics can be used to evaluate the product in future testing.

| Metric | Measurement |
|---|---|
| Review processing success | Percentage of valid CSV uploads processed |
| Evidence accuracy | Percentage of generated review references matching source data |
| Theme relevance | Human evaluation of extracted themes |
| Pulse generation time | Time taken to produce a weekly summary |
| Explanation quality | Human assessment of clarity and factual grounding |
| Approval compliance | Percentage of external actions executed only after approval |
| Draft safety | Number of emails automatically sent without approval; target: zero |

These are proposed evaluation metrics, not measured production results.

---

## 16. Limitations

- The initial demonstration dataset is small.
- Review coverage may not represent the entire Groww customer base.
- AI-generated themes and recommendations require human review.
- Gemini availability and response times may vary.
- Paraphrased reviews do not satisfy requirements for authentic verbatim quotations.
- Fee explanations require current official sources.
- Google integrations depend on valid OAuth authorization.
- The application is an educational prototype rather than an officially supported Groww product.

---

## 17. Future Improvements

Potential enhancements include:

1. Automated collection from permitted public review sources.
2. Scheduled weekly product intelligence reports.
3. Historical trend analysis across multiple weeks.
4. Theme frequency and sentiment visualizations.
5. More robust citation and source verification.
6. User accounts and role-based access control.
7. Persistent analysis history and database storage.
8. Feedback prioritization using severity, frequency, and business impact.
9. Evaluation dashboards for AI accuracy and recommendation quality.
10. More comprehensive monitoring, logging, and automated tests.

---

## 18. NextLeap Milestone 2 Deliverables

The project is designed to support the following submission artifacts:

- Public review CSV covering the selected 8–12 week period
- AI-generated themes and supporting evidence
- Three verified verbatim customer quotations
- Weekly Product Pulse (250 words or fewer)
- Customer Fee Explainer with official source links
- Approval-gated Google Docs entry
- Gmail draft evidence
- GitHub repository link
- Deployed prototype URL
- Source references and supporting screenshots

These deliverables should be individually verified before final submission.

---

## 19. Project Learnings

Through ReviewPulse AI, the project demonstrates practical experience with:

- AI-assisted product discovery
- Customer feedback analysis
- Product prioritization
- Evidence-backed product recommendations
- Prompt engineering and structured AI outputs
- REST API integration
- Human-in-the-loop workflow design
- Google OAuth and external API integrations
- Full-stack product development
- Cloud deployment and debugging

The project connects product management principles with technical implementation to create a working product intelligence prototype.

---

## 20. Author

**Aabha Tembhurne**

Product Management Fellow — NextLeap

B.E. Biotechnology — RV College of Engineering, Bengaluru

**Areas of Interest:** Product Management, AI-Powered Products, Healthcare Technology, Data Analytics, and Full-Stack Development.

---

## Disclaimer

ReviewPulse AI — Groww is an independent educational prototype developed for the NextLeap Product Management Fellowship. It is not an official Groww product and does not provide investment advice. Customer feedback summaries and AI-generated explanations should be independently verified before external use.

**Built with React, Node.js, Express, Google Gemini, Google APIs, Vercel, and Render.**
