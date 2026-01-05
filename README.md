<p align="center">
  <img src="https://img.icons8.com/color/96/000000/leaf.png" alt="EnCode Logo" width="80"/>
</p>

<h1 align="center">🌿 EnCode</h1>

<p align="center">
  <strong>Your intelligent food label interpretation co-pilot</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-5.0.0-646CFF?style=flat-square&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=flat-square&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"/>
</p>

---

## 🎯 What is EnCode?

EnCode is a modern web application that helps you **understand food ingredient labels** with calm, measured context. Simply paste an ingredient list or scan a product barcode, and get intelligent pattern-based analysis — no scare tactics, just clear insights.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   📷 Scan Barcode  ──►  🔍 AI Analysis  ──►  📊 Insights   │
│                                                             │
│   📝 Paste Ingredients  ──►  🧠 Pattern Detection  ──►  ✅  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔬 **Intelligent Analysis**

- Pattern-based ingredient interpretation
- Structural composition detection
- Confidence-rated insights
- Trade-off explanations

### 📷 **Barcode Scanner**

- Camera-based barcode scanning
- Image upload support
- Auto-fetch ingredients from Open Food Facts API
- Support for EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39

### 📚 **Analysis History**

- Secure cloud storage with Supabase
- Browse and revisit past analyses
- Quick access to previous judgments

### 🎨 **Beautiful UI**

- Clean, modern olive & grey design
- Smooth animations and transitions
- Responsive layout for all devices
- Dark mode ready components

### 🔐 **Secure & Private**

- Supabase authentication
- Row-level security (RLS)
- No data shared with third parties

---

## 🖼️ Demo

### Home Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│  🌿 EnCode                              [History] [New] [Exit] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ╔════════════════════════════════════════════════════════╗   │
│  ║  Food label co-pilot                                    ║   │
│  ║                                                         ║   │
│  ║  Interpret ingredients with                             ║   │
│  ║  calm, human context.                                   ║   │
│  ║                                                         ║   │
│  ║  [✨ Start Analysis]  [📷 Scan]  [📚 History]          ║   │
│  ╚════════════════════════════════════════════════════════╝   │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 🟢 Online    │  │ 📊 5 Saved   │  │ 🕐 Jan 4     │        │
│  │   & Ready    │  │   Analyses   │  │   Last Run   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

### Analysis Result

```
┌────────────────────────────────────────────────────────────────┐
│  What This Looks Like                                          │
│  ═══════════════════                                          │
│                                                                │
│  "A moderately processed convenience food with                 │
│   standard shelf-stability ingredients"                        │
│                                                    ✓ High      │
│                                                    Confidence  │
├────────────────────────────────────────────────────────────────┤
│  👁️ Why This Framing                                          │
│  ────────────────────                                         │
│  → Multiple sweetener types suggest flavor balancing           │
│  → Preservatives indicate extended shelf-life goals            │
│  → Natural flavors are standard industry practice              │
├────────────────────────────────────────────────────────────────┤
│  ⚖️ The Tradeoff                                              │
│  Convenience and shelf-stability vs. minimal processing        │
├────────────────────────────────────────────────────────────────┤
│  ❓ What the Label Can't Tell You                             │
│  Exact sourcing, processing methods, or nutritional impact     │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer        | Technology                           |
| ------------ | ------------------------------------ |
| **Frontend** | React 18, Vite 5, Lucide Icons       |
| **Styling**  | CSS Custom Properties, Animations    |
| **Backend**  | Supabase Edge Functions (TypeScript) |
| **Database** | Supabase PostgreSQL + RLS            |
| **Auth**     | Supabase Auth                        |
| **Barcode**  | ZXing Library + Open Food Facts API  |
| **AI**       | LLM-powered analysis engine          |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account & project
- Supabase CLI installed

### 1. Clone & Install

```bash
git clone https://github.com/YUVRAJ-SINGH-3178/Encode.git
cd Encode
npm install
```

### 2. Environment Setup

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup

Apply the schema from `supabase/schema.sql`:

```bash
# Using Supabase CLI
supabase db push

# Or run manually in Supabase SQL Editor
```

### 4. Deploy Edge Function

```bash
supabase functions deploy analyze_product

supabase secrets set \
  LLM_API_KEY=your-llm-api-key \
  SUPABASE_URL=your-supabase-url \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 📦 Project Structure

```
encode/
├── src/
│   ├── components/
│   │   ├── AnalysisResult.jsx    # Result display with insights
│   │   ├── BarcodeScanner.jsx    # Camera/upload barcode scanner
│   │   ├── ErrorBoundary.jsx     # Error handling wrapper
│   │   ├── HistoryList.jsx       # Past analyses browser
│   │   ├── IngredientInput.jsx   # Text input for ingredients
│   │   ├── LoadingState.jsx      # Animated loading screen
│   │   └── Toast.jsx             # Notification system
│   ├── lib/
│   │   └── supabase.js           # Supabase client config
│   ├── services/
│   │   ├── analysis.js           # Analysis API calls
│   │   ├── auth.js               # Authentication service
│   │   └── history.js            # History management
│   ├── App.jsx                   # Main application
│   ├── index.css                 # Global styles & theme
│   └── main.jsx                  # Entry point
├── supabase/
│   ├── schema.sql                # Database schema
│   └── functions/
│       └── analyze_product/      # Edge function
│           └── index.ts
├── index.html
├── vite.config.js
└── package.json
```

---

## 🎨 Design System

### Color Palette

| Color          | Hex       | Usage            |
| -------------- | --------- | ---------------- |
| 🫒 Olive       | `#6b7b3a` | Primary accent   |
| 🫒 Olive Light | `#d4dbc4` | Soft backgrounds |
| ⬜ Paper       | `#faf9f6` | Card backgrounds |
| ⬛ Text        | `#2d2a26` | Primary text     |
| 🔘 Grey        | `#f0f0f0` | Page background  |

### Typography

- **Serif**: Libre Baskerville (headings, judgments)
- **Sans**: Inter (body text, UI elements)

---

## 🔐 Security

- ✅ Supabase Row Level Security (RLS) enabled
- ✅ User data isolated by `user_id`
- ✅ Service role keys stored as Edge Function secrets
- ✅ No sensitive data exposed to frontend
- ✅ HTTPS enforced in production

---

## 📱 Browser Support

| Browser       | Support |
| ------------- | ------- |
| Chrome 90+    | ✅ Full |
| Firefox 88+   | ✅ Full |
| Safari 14+    | ✅ Full |
| Edge 90+      | ✅ Full |
| Mobile Safari | ✅ Full |
| Chrome Mobile | ✅ Full |

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder.

### Deploy Options

- **Vercel**: Connect repo, auto-deploy on push
- **Netlify**: Drag & drop `dist/` or connect repo
- **Cloudflare Pages**: Fast edge deployment
- **Traditional hosting**: Upload `dist/` contents

### Environment Variables

Ensure these are set in your hosting platform:

```
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

EnCode provides **pattern-based interpretation**, not medical or nutritional advice. Always consult healthcare professionals for health-related decisions.

---

<p align="center">
  Made with 💚 by <a href="https://github.com/YUVRAJ-SINGH-3178">Yuvraj Singh</a>
</p>

<p align="center">
  <a href="https://github.com/YUVRAJ-SINGH-3178/Encode/issues">Report Bug</a> •
  <a href="https://github.com/YUVRAJ-SINGH-3178/Encode/issues">Request Feature</a>
</p>
