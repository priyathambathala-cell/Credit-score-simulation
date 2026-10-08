# Credit Score Simulation Engine with MongoDB Backend
**2nd-Year B.Tech Computer Science & Engineering / Information Technology Project**

> ⚠️ **Educational Project Disclaimer:**
> Educational simulation only — this is not an official credit score and should not be used for real lending decisions. Results are estimates based on predefined project rules and are not official credit scores.

---

## 1. Project Overview & Problem Statement

Many first-time credit seekers and students do not understand how monthly income, repayment behavior, and existing debt obligations interact to determine creditworthiness. Commercial credit bureau scoring algorithms operate as opaque black boxes.

The **Credit Score Simulation Engine** is a full-stack educational web application that:
1. Calculates an estimated credit score on a clear **0 to 100** scale.
2. Provides full mathematical breakdown and explainability for each parameter.
3. Allows students to simulate hypothetical financial decisions (e.g., taking a ₹2.5L loan or missing 3 payments) and observe real-time score deltas ($\uparrow / \downarrow$).
4. Persists student profiles, evaluation history logs, and simulation records into a **MongoDB** database (with seamless offline `localStorage` fallback).

---

## 2. Full Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom fintech design system, responsive Grid/Flexbox), ES6+ JavaScript Modules
- **Backend:** Node.js, Express.js (REST API architecture)
- **Database:** MongoDB (via Mongoose ODM)
- **Persistence Strategy:** Hybrid Persistence (MongoDB database when server is active + client `localStorage` cache for offline accessibility)
- **Configuration:** Dotenv (`.env`) for database connection string and server ports.

---

## 3. Modular Directory Structure

```
WEBSITE MENTOR/
├── server.js             # Main Express server connecting to MongoDB & serving static files
├── package.json          # Node.js project manifest & dependencies
├── .env                  # Environment configuration (PORT, MONGODB_URI)
├── .env.example          # Environment template
│
├── config/
│   └── db.js             # Mongoose MongoDB connection manager with graceful fallback
│
├── models/
│   ├── User.js           # Mongoose Schema: Registered students & credentials
│   ├── ScoreHistory.js   # Mongoose Schema: Calculation & simulation history logs
│   └── Profile.js        # Mongoose Schema: Active baseline financial profile
│
├── routes/
│   ├── authRoutes.js     # REST API: /api/auth/register, /api/auth/login, /api/auth/demo
│   ├── scoreRoutes.js    # REST API: /api/scores/calculate, /api/scores/simulate
│   ├── historyRoutes.js  # REST API: /api/history (CRUD for score evaluation logs)
│   └── profileRoutes.js  # REST API: /api/profile (Get, update, reset active profile)
│
├── index.html            # Public Landing page with Hero, 6-Step Workflow & Live Preview
├── login.html            # Educational student login portal with 1-click demo login
├── register.html         # Educational account registration with validation
├── dashboard.html        # Overview dashboard with circular gauge, factor bars & math card
├── calculator.html       # Rule-based credit calculator with step-by-step breakdown
├── simulation.html       # Financial Decision Simulator with dual comparison & delta pills
├── history.html          # Score simulation history log with filters, modal view & CSV export
├── rules.html            # Transparent scoring rules, weightages & boundary tables
├── about.html            # Academic documentation, MongoDB architecture & viva guide
├── profile.html          # Student profile management and database workspace controls
│
├── css/
│   ├── style.css         # Global design tokens, navbar, sidebar, buttons, cards, modals
│   ├── dashboard.css     # Dashboard gauge meter, progress tracks, breakdown cards
│   ├── calculator.css    # Calculator inputs, validation alerts, step explainer cards
│   └── simulation.css    # Dual comparison panels, delta badges, factor comparison bars
│
├── js/
│   ├── api.js            # Frontend REST API client communicating with MongoDB
│   ├── scoring-engine.js # Core mathematical scoring engine & Strategy Pattern classes
│   ├── storage.js        # LocalStorage persistence & MongoDB background sync
│   ├── auth.js           # Educational authentication & session synchronizer
│   ├── dashboard.js      # Dashboard UI controller & gauge renderer
│   ├── calculator.js     # Calculator form handling, live validation & math steps
│   ├── simulation.js     # Simulator dual-panel controller & delta calculation
│   ├── history.js        # Score history table, filters, CSV exporter & modals
│   └── main.js           # Navigation drawer, toast alerts, formatters & modal handlers
│
└── README.md             # Project documentation for university submission
```

---

## 4. MongoDB Database Schemas

### 1. User Schema (`models/User.js`)
```javascript
{
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: '2nd Year B.Tech Student' },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Score History Schema (`models/ScoreHistory.js`)
```javascript
{
  userEmail: { type: String, default: 'demo@college.edu' },
  type: { type: String, enum: ['Manual Calculation', 'Simulation', 'Demo Preset'] },
  note: { type: String },
  inputs: {
    monthlyIncome: Number,
    totalRepayments: Number,
    onTimeRepayments: Number,
    existingDebt: Number,
    repaymentPercentage: Number
  },
  scores: {
    incomeScore: Number,
    repaymentScore: Number,
    debtScore: Number,
    weightedIncome: Number,
    weightedRepayment: Number,
    weightedDebt: Number,
    finalScore: Number
  },
  rating: { label: String, class: String, color: String, desc: String },
  breakdown: { incomeFormula: String, repaymentFormula: String, debtFormula: String, finalFormula: String },
  simulationMeta: { baselineScore: Number, simulatedScore: Number, delta: Number },
  formattedDate: String,
  timestamp: { type: Date, default: Date.now }
}
```

### 3. Financial Profile Schema (`models/Profile.js`)
```javascript
{
  userEmail: { type: String, default: 'demo@college.edu', unique: true },
  inputs: { monthlyIncome: Number, totalRepayments: Number, onTimeRepayments: Number, existingDebt: Number, repaymentPercentage: Number },
  scores: { incomeScore: Number, repaymentScore: Number, debtScore: Number, weightedIncome: Number, weightedRepayment: Number, weightedDebt: Number, finalScore: Number },
  rating: { label: String, class: String, color: String },
  breakdown: { incomeFormula: String, repaymentFormula: String, debtFormula: String, finalFormula: String },
  source: String
}
```

---

## 5. Scoring Methodology & Mathematical Rules

$$\text{Final Estimated Score} = (\text{Income Score} \times 0.30) + (\text{Repayment Score} \times 0.50) + (\text{Debt Score} \times 0.20)$$

| Financial Factor | Range / Formula | Score | Weight | Contribution Formula |
| :--- | :--- | :---: | :---: | :--- |
| **Monthly Income** | Below ₹20,000<br>₹20,000 – ₹39,999<br>₹40,000 – ₹59,999<br>₹60,000 and above | 40<br>60<br>80<br>100 | **30%** | $\text{Score} \times 0.30$ |
| **Repayment History** | $\left(\frac{\text{On-Time Repayments}}{\text{Total Repayments}}\right) \times 100$ | 0 – 100% | **50%** | $\text{Score} \times 0.50$ |
| **Existing Debt** | ₹0 – ₹50,000<br>₹50,001 – ₹1,00,000<br>₹1,00,001 – ₹2,00,000<br>Above ₹2,00,000 | 100<br>70<br>50<br>30 | **20%** | $\text{Score} \times 0.20$ |

#### Educational Rating System
- **80 – 100** $\rightarrow$ **`GOOD`**
- **60 – 79.99** $\rightarrow$ **`AVERAGE`**
- **Below 60** $\rightarrow$ **`POOR`**

---

## 6. How to Run the MongoDB Backend

### Prerequisites
- Node.js (v18 or higher)
- Optional: MongoDB Community Server (for local MongoDB) or a free MongoDB Atlas cluster connection string.

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (already created):
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/credit_score_db
   ```
   *(For MongoDB Atlas, replace `MONGODB_URI` with your connection string).*
3. Start the Express server:
   ```bash
   npm start
   ```
   Or in development mode with auto-reload:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   ```
   http://localhost:5000
   ```

---

## 7. Demo Credentials

- **Email:** `demo@college.edu`
- **Password:** `password123`
- **1-Click Login:** Click **"⚡ Use Preloaded Demo Account"** on `login.html`.
