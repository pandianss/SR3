// CAIIB Syllabus Content Graph
// Contains Subjects, Modules, Topics, MicroLessons, Formulas, and RBI Circular links.

export const SUBJECTS = [
  { id: "ABM",  label: "ABM",  name: "Advanced Bank Management", color: "#2DD4BF" },
  { id: "BFM",  label: "BFM",  name: "Bank Financial Management", color: "#60A5FA" },
  { id: "ABFM", label: "ABFM", name: "Adv. Business & Financial Mgmt", color: "#FB923C" },
  { id: "BRBL", label: "BRBL", name: "Banking Regulations & Laws", color: "#A78BFA" },
];

export const ELECTIVES = [
  { id: "Risk",    label: "Risk",    name: "Risk Management", color: "#E9A020" },
  { id: "IT",      label: "IT",      name: "IT & Digital Banking", color: "#10B981" },
  { id: "HR",      label: "HR",      name: "Human Resource Management", color: "#8B5CF6" },
  { id: "Rural",   label: "Rural",   name: "Rural Banking", color: "#F43F5E" },
  { id: "Central", label: "Central", name: "Central Banking", color: "#EC4899" }
];

export const MODULES = {
  ABM: [
    { id: "ABM-A", name: "Module A: Economic Analysis" },
    { id: "ABM-B", name: "Module B: Human Resource Management" },
    { id: "ABM-C", name: "Module C: Credit Management" },
    { id: "ABM-D", name: "Module D: Compliance & Governance" }
  ],
  BFM: [
    { id: "BFM-A", name: "Module A: International Banking" },
    { id: "BFM-B", name: "Module B: Risk Management" },
    { id: "BFM-C", name: "Module C: Treasury Management" },
    { id: "BFM-D", name: "Module D: Balance Sheet Management" }
  ],
  ABFM: [
    { id: "ABFM-A", name: "Module A: Management Process" },
    { id: "ABFM-B", name: "Module B: Advanced Financial Management" },
    { id: "ABFM-C", name: "Module C: Valuation, Mergers & Acquisitions" },
    { id: "ABFM-D", name: "Module D: Project Finance" }
  ],
  BRBL: [
    { id: "BRBL-A", name: "Module A: Regulatory Framework of Banking" },
    { id: "BRBL-B", name: "Module B: Legal Aspects of Banking Operations" },
    { id: "BRBL-C", name: "Module C: Banking Related Laws" },
    { id: "BRBL-D", name: "Module D: Commercial Laws" }
  ],
  Risk: [
    { id: "Risk-A", name: "Module A: An Overview of Risk" },
    { id: "Risk-B", name: "Module B: Credit Risk Measurement" },
    { id: "Risk-C", name: "Module C: Market Risk & Operational Risk" },
    { id: "Risk-D", name: "Module D: Risk Organization & Policy" }
  ],
  Rural: [
    { id: "Rural-A", name: "Module A: Rural India" },
    { id: "Rural-B", name: "Module B: Financing Rural Development" },
    { id: "Rural-C", name: "Module C: Priority Sector Financing" },
    { id: "Rural-D", name: "Module D: Challenges in Rural Banking" }
  ],
  Central: [
    { id: "Central-A", name: "Module A: Rationale & Functions of Central Bank" },
    { id: "Central-B", name: "Module B: Central Banking in India" },
    { id: "Central-C", name: "Module C: Monetary & Credit Policies" },
    { id: "Central-D", name: "Module D: Forex Reserve Management" },
    { id: "Central-E", name: "Module E: Regulation and Supervision" },
    { id: "Central-F", name: "Module F: NBFCs and Primary Dealers" }
  ],
  IT: [
    { id: "IT-A", name: "Module A: Information Technology in Banking" },
    { id: "IT-B", name: "Module B: Core Banking & Payment Systems" },
    { id: "IT-C", name: "Module C: Digital Banking Security" },
    { id: "IT-D", name: "Module D: Analytics & Emerging Tech" }
  ],
  HR: [
    { id: "HR-A", name: "Module A: HRM Concepts & Organization" },
    { id: "HR-B", name: "Module B: Training, Development & Career Path" },
    { id: "HR-C", name: "Module C: Performance & Compensation" },
    { id: "HR-D", name: "Module D: Industrial Relations & Discipline" }
  ]
};

export const TOPICS = {
  "ABM-A": [
    { id: "T-ABM-A1", name: "Business Cycles & GDP Trends", weightage: "High", dependency: [] },
    { id: "T-ABM-A2", name: "Inflation Mechanics (CPI vs WPI)", weightage: "Medium", dependency: [] },
    { id: "T-ABM-A3", name: "Union Budget & Fiscal Policy", weightage: "High", dependency: ["T-ABM-A1"] }
  ],
  "ABM-B": [
    { id: "T-ABM-B1", name: "HR Planning & Recruitment in Banks", weightage: "Medium", dependency: [] },
    { id: "T-ABM-B2", name: "Training, Development & Performance Appraisal", weightage: "Medium", dependency: ["T-ABM-B1"] },
    { id: "T-ABM-B3", name: "Motivation Theories & Leadership Styles", weightage: "Medium", dependency: [] },
    { id: "T-ABM-B4", name: "Organisational Behaviour & Change Management", weightage: "Low", dependency: [] }
  ],
  "ABM-C": [
    { id: "T-ABM-C1", name: "Working Capital Assessment", weightage: "Critical", dependency: [] },
    { id: "T-ABM-C2", name: "NPA Management & Resolution", weightage: "Critical", dependency: [] },
    { id: "T-ABM-C3", name: "Credit Risk Rating Frameworks", weightage: "High", dependency: ["T-ABM-C1"] }
  ],
  "ABM-D": [
    { id: "T-ABM-D1", name: "KYC / AML Framework & Compliance", weightage: "Critical", dependency: [] },
    { id: "T-ABM-D2", name: "Corporate Governance in Banks", weightage: "High", dependency: [] },
    { id: "T-ABM-D3", name: "Fraud Risk Management & Vigilance", weightage: "High", dependency: ["T-ABM-D1"] }
  ],
  "BFM-B": [
    { id: "T-BFM-B1", name: "Basel III Capital Adequacy", weightage: "Critical", dependency: [] },
    { id: "T-BFM-B2", name: "Value at Risk (VaR) Analysis", weightage: "High", dependency: [] },
    { id: "T-BFM-B3", name: "Operational Risk Management (BIA, TSA, AMA)", weightage: "Medium", dependency: ["T-BFM-B1"] }
  ],
  "BFM-D": [
    { id: "T-BFM-D1", name: "Liquidity Coverage Ratio (LCR)", weightage: "Critical", dependency: ["T-BFM-B1"] },
    { id: "T-BFM-D2", name: "Interest Rate Risk & ALM", weightage: "High", dependency: [] },
    { id: "T-BFM-D3", name: "Net Stable Funding Ratio (NSFR)", weightage: "High", dependency: ["T-BFM-D1"] }
  ],
  "ABFM-B": [
    { id: "T-ABFM-B1", name: "Capital Asset Pricing Model (CAPM)", weightage: "High", dependency: [] },
    { id: "T-ABFM-B2", name: "Capital Budgeting Techniques (NPV/IRR)", weightage: "Critical", dependency: [] },
    { id: "T-ABFM-B3", name: "Weighted Average Cost of Capital (WACC)", weightage: "High", dependency: ["T-ABFM-B1"] }
  ],
  "BRBL-A": [
    { id: "T-BRBL-A1", name: "Banking Regulation Act 1949", weightage: "Critical", dependency: [] },
    { id: "T-BRBL-A2", name: "Reserve Bank of India Act 1934", weightage: "High", dependency: [] }
  ],
  "BRBL-C": [
    { id: "T-BRBL-C1", name: "SARFAESI Act Operations & Powers", weightage: "Critical", dependency: ["T-BRBL-A1"] },
    { id: "T-BRBL-C2", name: "Insolvency and Bankruptcy Code (IBC)", weightage: "High", dependency: [] }
  ],
  "Risk-A": [
    { id: "T-Risk-A1", name: "Asset Liability Management Guidelines", weightage: "High", dependency: [] },
    { id: "T-Risk-A2", name: "Stress Testing & Scenario Analysis", weightage: "Medium", dependency: [] }
  ],
  "Rural-C": [
    { id: "T-Rural-C1", name: "Priority Sector Lending Limits", weightage: "Critical", dependency: [] },
    { id: "T-Rural-C2", name: "Government Rural Development Schemes", weightage: "High", dependency: [] }
  ],
  "Central-C": [
    { id: "T-Central-C1", name: "Monetary Policy Instruments (CRR/SLR)", weightage: "Critical", dependency: [] },
    { id: "T-Central-C2", name: "Liquidity Adjustment Facility (LAF)", weightage: "High", dependency: [] }
  ],
  "IT-C": [
    { id: "T-IT-C1", name: "Cyber Incident Reporting & Response", weightage: "Critical", dependency: [] },
    { id: "T-IT-C2", name: "Core Banking Security Architectures", weightage: "High", dependency: [] }
  ],
  "HR-C": [
    { id: "HR-C1", name: "Performance Management Systems (PMS)", weightage: "Medium", dependency: [] },
    { id: "HR-C2", name: "Compensation Structure & Stock Options", weightage: "Low", dependency: [] }
  ]
};

// Seed database with pre-built microlessons corresponding to topics
export const MICRO_LESSONS = [
  {
    id: "L-BFM-B1",
    topicId: "T-BFM-B1",
    subjectId: "BFM",
    title: "Basel III Framework",
    badge: "Regulatory · Capital",
    time: "3 min",
    emoji: "🏛️",
    steps: [
      {
        kind: "concept",
        title: "Capital Adequacy & Buffers",
        body: "Basel III mandates minimum capital requirements to absorb unexpected bank losses. It comprises Tier 1 (going-concern, mainly Common Equity Tier 1 - CET1) and Tier 2 (gone-concern, e.g. subordinated debt) capital. Additional buffers include the Capital Conservation Buffer (CCB) and Countercyclical Buffer (CCyB).",
        highlight: "CET1: 5.5% | Tier 1: 7.0% | Total Capital: 9.0% | CCB: +2.5% (Total 11.5%)"
      },
      {
        kind: "pillars",
        title: "The Three Regulatory Pillars",
        pillars: [
          { e: "🛡️", n: "Pillar 1", d: "Minimum capital standards for Credit, Market, and Operational risks." },
          { e: "🔍", n: "Pillar 2", d: "Supervisory review process (ICAAP) to identify and evaluate bank-wide risk risks." },
          { e: "📢", n: "Pillar 3", d: "Market discipline through comprehensive disclosure of risk exposures and capital." }
        ]
      },
      {
        kind: "scenario",
        title: "Tier I & CRAR Calculation",
        problem: "Bank Beta: Risk-Weighted Assets (RWA) = ₹2,000 Cr | Common Equity (CET1) = ₹130 Cr | Additional Tier I = ₹30 Cr | Tier II = ₹50 Cr.",
        steps: [
          "CET1 Ratio = 130 / 2,000 = 6.5% (Required: ≥ 5.5% under RBI) ✓",
          "Tier I Capital = 130 + 30 = ₹160 Cr | Tier I Ratio = 160 / 2,000 = 8.0% (Required: ≥ 7.0%) ✓",
          "Total Capital = 160 + 50 = ₹210 Cr | CRAR (Total Capital Ratio) = 210 / 2,000 = 10.5% (Required: ≥ 9.0%) ✓"
        ],
        verdict: "✅ Basel III Compliant under standard RBI norms (Excluding CCB buffer requirements)."
      },
      {
        kind: "quiz",
        question: "What is the minimum Capital Adequacy Ratio (CAR/CRAR) required by RBI for scheduled commercial banks (excluding buffers)?",
        opts: ["8.0%", "9.0%", "10.5%", "11.5%"],
        correct: 1,
        why: "While Basel III guidelines specify a minimum of 8.0%, RBI prescribes a stricter standard of 9.0% for scheduled commercial banks in India."
      }
    ]
  },
  {
    id: "L-BFM-D1",
    topicId: "T-BFM-D1",
    subjectId: "BFM",
    title: "Liquidity Coverage Ratio (LCR)",
    badge: "Liquidity Risk",
    time: "2 min",
    emoji: "💧",
    steps: [
      {
        kind: "concept",
        title: "High Quality Liquid Assets (HQLA)",
        body: "LCR requires banks to hold an ongoing stock of unencumbered High Quality Liquid Assets (HQLA) that can be easily converted into cash to meet liquidity needs for a 30-day severe stress scenario. HQLA is divided into Level 1 (government bonds, cash, zero risk) and Level 2 (high-rated corporate bonds, commercial paper, subject to haircuts).",
        highlight: "LCR = Stock of HQLA / Total Net Cash Outflows over 30 days ≥ 100%"
      },
      {
        kind: "pillars",
        title: "Pillars of Liquidity Standards",
        pillars: [
          { e: "⚡", n: "Level 1 Assets", d: "Cash, excess CRR, SLR securities (with RBI haircut allowances). No cap, no haircut." },
          { e: "📉", n: "Level 2 Assets", d: "High-grade corporate debt, commercial papers. Capped at 40% of total HQLA; 15% haircut." },
          { e: "💰", n: "Net Cash Outflows", d: "Expected cash outflows minus expected cash inflows (inflows capped at 75% of outflows)." }
        ]
      },
      {
        kind: "scenario",
        title: "LCR Threshold Validation",
        problem: "Bank Gamma: Stock of Level 1 HQLA = ₹400 Cr | Level 2 HQLA (after haircut) = ₹100 Cr | Projected Cash Outflows over 30 days = ₹600 Cr | Projected Cash Inflows = ₹200 Cr.",
        steps: [
          "Total HQLA = 400 + 100 = ₹500 Cr",
          "Net Cash Outflows = Outflows (600) - Inflows (200) = ₹400 Cr (Inflow check: 200 Cr is 33% of outflows, which is below the 75% cap, so fully allowed)",
          "LCR Ratio = 500 / 400 = 125% ✓"
        ],
        verdict: "✅ Compliant (LCR is 125%, exceeding the regulatory minimum of 100%)."
      },
      {
        kind: "quiz",
        question: "Under LCR regulations, expected cash inflows from outstanding loans are capped at what percentage of total expected cash outflows?",
        opts: ["40%", "50%", "75%", "90%"],
        correct: 2,
        why: "To prevent banks from relying purely on anticipated inflows during a severe liquidity stress event, inflows are capped at 75% of total expected outflows."
      }
    ]
  },
  {
    id: "L-ABM-C1",
    topicId: "T-ABM-C1",
    subjectId: "ABM",
    title: "Working Capital Assessment",
    badge: "Credit · Numerical",
    time: "4 min",
    emoji: "📊",
    steps: [
      {
        kind: "concept",
        title: "Turnover Method & MPBF",
        body: "Banks assess working capital requirements for borrowers using methods like the Nayak Committee Turnover Method (for limits up to ₹5 Cr) and the Tandon Committee Maximum Permissible Bank Finance (MPBF) Method. Under the Turnover Method, working capital is estimated at 25% of projected turnover, with the borrower bringing in 5% as margin and the bank funding 20%.",
        highlight: "Nayak Limit = 20% of Projected Turnover | Margin = 5% of Turnover"
      },
      {
        kind: "pillars",
        title: "Tandon Committee Methods",
        pillars: [
          { e: "📐", n: "Method I", d: "MPBF = 75% of (Current Assets - Current Liabilities other than Bank Borrowings)." },
          { e: "⚖️", n: "Method II", d: "MPBF = (75% of Current Assets) - Current Liabilities other than Bank Borrowings. Stricter margin." },
          { e: "💼", n: "Net Working Capital", d: "Current Assets minus Current Liabilities. Represents borrower's margin contribution." }
        ]
      },
      {
        kind: "scenario",
        title: "MPBF Method II Calculation",
        problem: "Borrower: Projected Current Assets (CA) = ₹800 Lakhs | Current Liabilities (CL) excluding Bank Borrowing = ₹200 Lakhs.",
        steps: [
          "Total Current Assets = ₹800 Lakhs",
          "Borrower Margin (25% of CA) = 0.25 * 800 = ₹200 Lakhs",
          "MPBF = (0.75 * CA) - CL = (0.75 * 800) - 200 = 600 - 200 = ₹400 Lakhs"
        ],
        verdict: "✅ Maximum Bank Finance is ₹400 Lakhs. Borrower must bring in ₹200 Lakhs margin."
      },
      {
        kind: "quiz",
        question: "Under Tandon Committee Method II, the borrower is required to bring in a margin equivalent to what percentage of Current Assets?",
        opts: ["10%", "20%", "25%", "33%"],
        correct: 2,
        why: "Tandon Method II dictates that the borrower must fund 25% of the total Current Assets from long-term sources (margin), whereas Method I requires 25% of the working capital gap."
      }
    ]
  },
  {
    id: "L-ABFM-B1",
    topicId: "T-ABFM-B1",
    subjectId: "ABFM",
    title: "Capital Asset Pricing Model (CAPM)",
    badge: "Valuation · Finance",
    time: "3 min",
    emoji: "📈",
    steps: [
      {
        kind: "concept",
        title: "Cost of Equity (Ke)",
        body: "CAPM calculates the expected rate of return on an asset (cost of equity for capital budgeting) by adding a risk premium to a risk-free rate. The risk premium is the market risk premium multiplied by the asset's beta (representing systematic, non-diversifiable risk relative to the market).",
        highlight: "Ke = Rf + Beta * (Rm - Rf) | Rm - Rf = Market Risk Premium"
      },
      {
        kind: "pillars",
        title: "CAPM Components",
        pillars: [
          { e: "🛡️", n: "Risk-Free Rate (Rf)", d: "Yield on government securities (typically 10-year G-Sec yield in India)." },
          { e: "📊", n: "Beta (β)", d: "Measure of volatility of the stock relative to the market index. β > 1 indicates higher risk." },
          { e: "💰", n: "Risk Premium", d: "The additional return expected for taking on equity market risk over G-Secs." }
        ]
      },
      {
        kind: "scenario",
        title: "Cost of Equity Assessment",
        problem: "Project Valuation: G-Sec Yield (Rf) = 7.0% | Expected Market Return (Rm) = 13.0% | Project Beta (β) = 1.25.",
        steps: [
          "Market Risk Premium = Rm - Rf = 13.0% - 7.0% = 6.0%",
          "Equity Risk Premium = Beta * (Rm - Rf) = 1.25 * 6.0% = 7.5%",
          "Expected Return (Ke) = 7.0% + 7.5% = 14.5% ✓"
        ],
        verdict: "✅ Cost of equity is 14.5%. This is the hurdle rate to discount cash flows."
      },
      {
        kind: "quiz",
        question: "If a project's Beta is exactly 1.0, what is its expected return under the CAPM model?",
        opts: ["Risk-free rate", "Market rate of return", "Risk premium only", "Average inflation rate"],
        correct: 1,
        why: "When Beta = 1.0, Ke = Rf + 1.0 * (Rm - Rf) = Rm. The expected return equals the average market rate of return."
      }
    ]
  },
  {
    id: "L-BRBL-C1",
    topicId: "T-BRBL-C1",
    subjectId: "BRBL",
    title: "SARFAESI Act Operations",
    badge: "Legal · Recovery",
    time: "3 min",
    emoji: "🔨",
    steps: [
      {
        kind: "concept",
        title: "Enforcement of Security Interest",
        body: "The SARFAESI Act 2002 allows banks and financial institutions to recover bad debts by seizing and selling the underlying secured assets (collateral) without court intervention, provided the account is classified as an NPA and the outstanding dues exceed ₹1 Lakh.",
        highlight: "Exemptions: Agricultural land, accounts with remaining debt under 20% of principal"
      },
      {
        kind: "pillars",
        title: "SARFAESI Recovery Workflow",
        pillars: [
          { e: "📄", n: "Section 13(2) Notice", d: "Demand notice giving the borrower 60 days to clear outstanding liabilities." },
          { e: "🔑", n: "Section 13(4) Action", d: "Empowers the bank to take physical possession of security or manage the asset." },
          { e: "⚖️", n: "DRT Appeals", d: "Borrowers can appeal to the Debt Recovery Tribunal (DRT) within 45 days of possession." }
        ]
      },
      {
        kind: "scenario",
        title: "SARFAESI Enforceability Check",
        problem: "Borrower X: Outstanding principal = ₹10 Lakhs | Total original loan = ₹50 Lakhs | Collateral = 2 acres of agricultural land.",
        steps: [
          "Account Status: Classified as NPA, outstanding is ₹10 Lakhs (above ₹1 Lakh limit).",
          "Check Outstanding Balance: ₹10 Lakhs is exactly 20% of principal. (If remaining balance is < 20%, SARFAESI is barred). Here, it is 20% so technically just borders eligibility.",
          "Check Collateral Type: Asset is agricultural land. Under Section 31(i) of the Act, agricultural land is strictly exempt from SARFAESI."
        ],
        verdict: "❌ SARFAESI Action Barred — Collateral is agricultural land. Bank must file suit in civil court or DRT."
      },
      {
        kind: "quiz",
        question: "Within how many days must a borrower appeal to the Debt Recovery Tribunal (DRT) against a bank's possession notice under SARFAESI?",
        opts: ["30 days", "45 days", "60 days", "90 days"],
        correct: 1,
        why: "Under Section 17 of the SARFAESI Act, an aggrieved borrower or third party can appeal to the DRT within 45 days from the date of recovery measures."
      }
    ]
  },

  // ─── ABM Module A: Economic Analysis ───────────────────────────────────────
  {
    id: "L-ABM-A1",
    topicId: "T-ABM-A1",
    subjectId: "ABM",
    title: "Business Cycles & GDP Trends",
    badge: "Economics · Macro",
    time: "4 min",
    emoji: "📊",
    steps: [
      {
        kind: "concept",
        title: "Phases of a Business Cycle",
        body: "A business cycle refers to periodic fluctuations in economic activity as measured by real GDP. It has four phases: Expansion (rising output, employment, incomes), Peak (maximum output, inflationary pressure begins), Contraction/Recession (declining output, rising unemployment — two consecutive quarters of negative growth = technical recession), and Trough (lowest output, deflationary risk). Banks must align credit strategy to cycle phase — cautious lending at peaks, counter-cyclical buffer build-up during expansion.",
        highlight: "GDP Growth > 6%: Expansion | Two qtrs negative GDP: Technical Recession | Recovery: GDP rising from trough"
      },
      {
        kind: "pillars",
        title: "GDP Measurement Methods",
        pillars: [
          { e: "🏭", n: "Production Method", d: "Sum of value added by all industries — avoids double counting by counting only net output at each stage of production." },
          { e: "💰", n: "Expenditure Method", d: "GDP = C + I + G + (X − M). Consumption + Investment + Government Spending + Net Exports. Most widely cited." },
          { e: "🧾", n: "Income Method", d: "Sum of all incomes earned: wages, rent, profit, interest. Nominal GDP adjusted by GDP Deflator gives Real GDP." }
        ]
      },
      {
        kind: "concept",
        title: "Leading, Lagging & Coincident Indicators",
        body: "Economic indicators help bankers forecast cycle turning points. Leading indicators (stock markets, PMI, building permits, repo rate changes) predict future activity. Coincident indicators (industrial production, retail sales, employment levels) reflect current state. Lagging indicators (NPA ratios, loan delinquency rates, CPI) confirm trends after they occur. RBI uses a composite leading index to inform monetary policy timing. A PMI reading above 50 signals expansion; below 50 signals contraction.",
        highlight: "PMI > 50: Expansion | PMI < 50: Contraction | Key RBI data: IIP, CPI, WPI, Bank Credit Growth"
      },
      {
        kind: "scenario",
        title: "GDP & Credit Strategy Analysis",
        problem: "Economy data: Nominal GDP = ₹200 Lakh Cr | GDP Deflator = 110 | Bank Credit Growth = 16% YoY | RBI Policy: Repo raised 50 bps to 6.5% in latest review.",
        steps: [
          "Real GDP = Nominal GDP / (GDP Deflator / 100) = 200 / 1.10 = ₹181.8 Lakh Cr",
          "Credit growth (16%) significantly exceeds nominal GDP growth (~8%) — potential overlending; asset quality pressure building.",
          "Repo rate hike signals RBI is in tightening phase to suppress demand-pull inflation at the cycle peak.",
          "Banks should tighten credit standards, build provisions, and position for cycle turning toward contraction."
        ],
        verdict: "⚠ Economy at Peak phase — prudent provisioning and tighter credit appraisal warranted now."
      },
      {
        kind: "quiz",
        question: "Which of the following is a LEADING economic indicator that banks use to anticipate credit demand before official GDP data is released?",
        opts: ["Historical NPA Ratios", "Purchasing Managers Index (PMI)", "Lagged Industrial Output", "CPI from the previous quarter"],
        correct: 1,
        why: "PMI is a forward-looking, survey-based indicator published monthly. A reading above 50 signals expansion and incoming credit demand. NPA ratios and historical CPI are lagging indicators — they confirm past trends, not future ones."
      }
    ]
  },
  {
    id: "L-ABM-A2",
    topicId: "T-ABM-A2",
    subjectId: "ABM",
    title: "Inflation Mechanics: CPI vs WPI",
    badge: "Economics · Monetary Policy",
    time: "3 min",
    emoji: "📈",
    steps: [
      {
        kind: "concept",
        title: "CPI vs WPI: Construction & Scope",
        body: "India uses two primary inflation indices. CPI (Consumer Price Index) measures retail price changes experienced by final consumers — food & beverages (45.9%), housing (10.1%), fuel (6.8%), clothing, education, and health. RBI uses CPI (Combined) as the headline target under Flexible Inflation Targeting (FIT). WPI (Wholesale Price Index) tracks prices at the producer/wholesale level: primary articles (22.6%), fuel & power (13.2%), and manufactured goods (64.2%). WPI does not include services; CPI covers both goods and services.",
        highlight: "RBI Inflation Target: CPI 4% ± 2% (floor 2%, ceiling 6%) | CPI Base Year: 2012=100 | WPI Base: 2011-12=100"
      },
      {
        kind: "pillars",
        title: "Types of Inflation",
        pillars: [
          { e: "📦", n: "Demand-Pull", d: "Excess aggregate demand over supply — 'too much money chasing too few goods.' Managed via repo rate hikes to reduce money supply." },
          { e: "🏗️", n: "Cost-Push", d: "Supply-side shock — rising input costs (crude oil, wages, raw materials) push up prices. Harder to control via monetary policy alone." },
          { e: "💸", n: "Built-in / Wage-Price Spiral", d: "Workers demand higher wages citing past inflation; firms raise prices to cover higher wages. Self-reinforcing cycle requiring structural intervention." }
        ]
      },
      {
        kind: "scenario",
        title: "Real Interest Rate & Lending Impact",
        problem: "Bank lending rate: 9.5% | Current CPI: 6.2% | WPI: 3.1% | RBI Repo: 6.5%.",
        steps: [
          "Real Lending Rate = Nominal Rate − CPI = 9.5% − 6.2% = 3.3% — acceptable margin.",
          "Fisher Effect: If CPI rises to 8%, real rate falls to 1.5% — severely erodes bank margins on fixed-rate loans.",
          "WPI (3.1%) < CPI (6.2%) — gap signals services and food inflation dominates; manufactured goods cost-push is contained.",
          "RBI likely to hike repo if CPI persists above 5% — banks must prepare for MCLR/EBLR repricing upward."
        ],
        verdict: "⚠ Elevated CPI erodes real margins — banks should maximise floating-rate loan exposure and hedge fixed-rate books."
      },
      {
        kind: "quiz",
        question: "Under India's Flexible Inflation Targeting (FIT) framework, RBI is mandated to maintain CPI inflation at:",
        opts: ["2% ± 1%", "4% ± 2%", "5% ± 1%", "3% ± 1%"],
        correct: 1,
        why: "The Monetary Policy Committee (MPC) operates under a legal mandate (amended RBI Act 2016) to keep CPI inflation at 4%, with a ±2% tolerance band. Breaching the band for three consecutive quarters requires a written explanation to the government."
      }
    ]
  },
  {
    id: "L-ABM-A3",
    topicId: "T-ABM-A3",
    subjectId: "ABM",
    title: "Union Budget & Fiscal Policy",
    badge: "Economics · Fiscal",
    time: "5 min",
    emoji: "🏛️",
    steps: [
      {
        kind: "concept",
        title: "Structure of the Union Budget",
        body: "The Union Budget is the annual financial statement of the Government of India presented in Parliament under Article 112 of the Constitution. It has two parts: Revenue Budget (tax revenues + non-tax revenues vs. revenue expenditure on salaries, subsidies, interest payments) and Capital Budget (capital receipts from borrowings, disinvestment vs. capital expenditure on infrastructure, asset creation). The fiscal deficit — the excess of total expenditure over total receipts excluding borrowings — is the primary metric driving market interest rates and bank treasury portfolios.",
        highlight: "Fiscal Deficit = Total Expenditure − (Revenue Receipts + Non-Debt Capital Receipts) | FRBM Target: 3% of GDP"
      },
      {
        kind: "pillars",
        title: "Three Key Deficit Metrics",
        pillars: [
          { e: "🔴", n: "Revenue Deficit", d: "Revenue Expenditure > Revenue Receipts. Government is borrowing for current consumption — structurally unsustainable; crowds out capital formation." },
          { e: "🟡", n: "Fiscal Deficit", d: "Total expenditure − all non-borrowed receipts. Primary borrowing requirement that drives G-Sec supply and market yields upward." },
          { e: "🟢", n: "Primary Deficit", d: "Fiscal Deficit − Interest Payments. Reflects current-year fresh borrowing excluding legacy debt service. Target: Zero or surplus for sound debt management." }
        ]
      },
      {
        kind: "concept",
        title: "FRBM Act & Impact on Bank Treasury",
        body: "The Fiscal Responsibility & Budget Management (FRBM) Act 2003 mandates deficit reduction targets. When fiscal deficits are high, the government issues large volumes of G-Secs to borrow from the market — increasing supply pushes G-Sec yields up. Banks holding G-Secs under AFS (Available for Sale) or HFT (Held for Trading) must mark portfolios to market, recognising losses in their P&L when yields rise. Conversely, fiscal consolidation reduces G-Sec supply, eases yields, and provides MTM gains to bank bond portfolios. SLR (Statutory Liquidity Ratio) mandates minimum G-Sec holding.",
        highlight: "G-Sec yield ↑ (from high deficit) → Bond price ↓ → MTM loss on AFS/HFT portfolio | HTM portfolio: no immediate MTM impact"
      },
      {
        kind: "scenario",
        title: "Fiscal Deficit & Deficit Metrics Computation",
        problem: "Government FY Data: Revenue Receipts = ₹25 Lakh Cr | Non-Debt Capital Receipts (disinvestment etc.) = ₹2 Lakh Cr | Revenue Expenditure = ₹32 Lakh Cr | Capital Expenditure = ₹10 Lakh Cr | Interest Payments (included in Revenue Exp.) = ₹10 Lakh Cr.",
        steps: [
          "Total Receipts (excl. borrowings) = 25 + 2 = ₹27 Lakh Cr",
          "Total Expenditure = 32 + 10 = ₹42 Lakh Cr",
          "Fiscal Deficit = 42 − 27 = ₹15 Lakh Cr",
          "Revenue Deficit = Revenue Expenditure − Revenue Receipts = 32 − 25 = ₹7 Lakh Cr",
          "Primary Deficit = Fiscal Deficit − Interest Payments = 15 − 10 = ₹5 Lakh Cr"
        ],
        verdict: "⚠ Fiscal Deficit ₹15 Lakh Cr and Primary Deficit ₹5 Lakh Cr both signal heavy market borrowing — upward pressure on G-Sec yields expected."
      },
      {
        kind: "quiz",
        question: "A bank holding G-Secs under the AFS (Available for Sale) category faces which immediate P&L risk when the government announces a significantly higher-than-expected fiscal deficit?",
        opts: [
          "Credit risk — the government may default on bonds",
          "MTM loss as G-Sec yields rise on heavy supply of new borrowings",
          "Foreign exchange risk on FPI outflows",
          "Operational risk from increased settlement volume"
        ],
        correct: 1,
        why: "Higher fiscal deficit → larger G-Sec issuance → increased supply → yields rise → AFS bond prices fall → banks must mark-to-market, recognising losses immediately in P&L. HTM portfolios are insulated from immediate MTM impact but face risk if held-to-maturity yields shift."
      }
    ]
  },

  // ─── ABM Module B: HRM ──────────────────────────────────────────────────────
  {
    id: "L-ABM-B1",
    topicId: "T-ABM-B1",
    subjectId: "ABM",
    title: "HR Planning & Recruitment in Banks",
    badge: "HRM · Workforce",
    time: "3 min",
    emoji: "👥",
    steps: [
      {
        kind: "concept",
        title: "Human Resource Planning Process",
        body: "HR Planning (Manpower Planning) ensures a bank has the right number of people with the right skills at the right positions at the right time. The process: (1) Skills inventory of existing workforce, (2) Demand forecasting based on business growth, branch expansion, retirements, and technology changes, (3) Supply forecasting — internal promotions, transfers, new hiring pipeline, (4) Gap analysis — net surplus or deficit, (5) Action plan — recruit, train, redeploy, or rightsize.",
        highlight: "HR Plan: Demand Forecast → Supply Forecast → Net Gap → Action Plan (Recruit / Train / Redeploy)"
      },
      {
        kind: "pillars",
        title: "Recruitment Methods in Banking",
        pillars: [
          { e: "📋", n: "IBPS / RBI Recruitment", d: "Centralised exam-based hiring for PSBs via IBPS CWE (Clerk, PO, Specialist Officer). RBI conducts its own Grade B exam." },
          { e: "🔄", n: "Internal Recruitment", d: "Promotion, transfer, and deputation — cost-effective, preserves institutional knowledge; limited infusion of fresh external talent." },
          { e: "🌐", n: "Lateral / Campus Hiring", d: "Direct mid-senior hiring for specialist roles (treasury, data analytics, risk, cybersecurity) increasingly common in public and private banks." }
        ]
      },
      {
        kind: "scenario",
        title: "Workforce Gap Analysis",
        problem: "Bank target: 500 branch credit officers by FY-end | Current officers = 380 | Expected attrition = 40 | IBPS intake scheduled = 120.",
        steps: [
          "Net current supply after attrition = 380 − 40 = 340 officers",
          "Demand = 500 officers",
          "Gap = 500 − 340 = 160 officers required",
          "IBPS intake covers 120 → Residual gap = 40 → must be filled via lateral hiring or internal redeployment"
        ],
        verdict: "⚠ Shortage of 40 officers even post-IBPS intake — lateral hiring or redeployment from non-credit roles required."
      },
      {
        kind: "quiz",
        question: "Which of the following is the correct sequence in the Human Resource Planning process?",
        opts: [
          "Recruitment → Gap Analysis → Demand Forecast → Action Plan",
          "Demand Forecast → Supply Forecast → Gap Analysis → Action Plan",
          "Action Plan → Gap Analysis → Supply Forecast → Demand Forecast",
          "Succession Planning → Recruitment → Training → Performance Appraisal"
        ],
        correct: 1,
        why: "HR Planning follows a logical sequence: forecast future workforce demand (based on business targets) → assess internal supply (current headcount projections) → identify the net gap (surplus or deficit) → execute action plans (recruit externally, train, redeploy). Skipping gap analysis leads to under- or over-hiring."
      }
    ]
  },
  {
    id: "L-ABM-B2",
    topicId: "T-ABM-B2",
    subjectId: "ABM",
    title: "Training, Development & Performance Appraisal",
    badge: "HRM · Development",
    time: "5 min",
    emoji: "🎓",
    steps: [
      {
        kind: "concept",
        title: "Training vs. Development",
        body: "Training is a short-term, task-oriented process addressing current job requirements (e.g., CBS Finacle operations for new recruits, KYC refresher for branch staff). Development is a long-term, career-oriented process preparing employees for future roles (e.g., leadership development programmes for AGMs targeting DGM positions). Key banking training institutions: IIBF (Indian Institute of Banking & Finance — JAIIB, CAIIB, Diploma courses), NIBM Pune (National Institute of Bank Management — management programmes), BIRD (Bankers Institute of Rural Development — rural credit).",
        highlight: "Training: Current job skills | Development: Future role preparation | IIBF: JAIIB, CAIIB | NIBM: Management | BIRD: Rural"
      },
      {
        kind: "pillars",
        title: "Performance Appraisal Methods in Banks",
        pillars: [
          { e: "📊", n: "Annual Confidential Report (ACR)", d: "Traditional PSB method — superior rates subordinate on defined parameters annually. Criticised for subjectivity and recency bias." },
          { e: "🎯", n: "Balanced Scorecard (BSC)", d: "Holistic appraisal across 4 perspectives: Financial (NPA, credit growth), Customer (CSAT, complaints), Internal Process (TAT, errors), Learning & Growth (training hours, new skills)." },
          { e: "360°", n: "360-Degree Feedback", d: "Input from superiors, peers, subordinates, and self-assessment. Reduces rating bias; increasingly adopted in new-generation private banks." }
        ]
      },
      {
        kind: "concept",
        title: "Kirkpatrick's 4-Level Training Evaluation Model",
        body: "Kirkpatrick's Model is the standard framework for measuring training ROI: Level 1 (Reaction) — trainee satisfaction (post-programme survey); Level 2 (Learning) — knowledge acquired (pre/post-test score); Level 3 (Behaviour) — is learning being applied on the job? (supervisor observation at 3–6 months); Level 4 (Results) — quantifiable business outcomes (lower NPA, faster KYC TAT, reduced fraud, higher CSAT scores). Most banks measure only Level 1–2; Level 3–4 measurement distinguishes high-quality training functions.",
        highlight: "L1: Reaction | L2: Learning | L3: Behaviour Change on Job | L4: Measurable Business Outcomes"
      },
      {
        kind: "scenario",
        title: "Training Effectiveness — Kirkpatrick Analysis",
        problem: "Bank ran a 3-day Credit Appraisal workshop for 50 branch managers. Pre-test: 48% average. Post-test: 72% average. 6 months later: credit proposal error rate fell from 12% to 7%. CSAT for loan processing improved by 18%.",
        steps: [
          "Level 2 (Learning): Score improvement 48% → 72% (+24 pp) — significant knowledge acquisition confirmed.",
          "Level 3 (Behaviour): Error rate 12% → 7% — managers are applying improved appraisal techniques on the job.",
          "Level 4 (Results): CSAT +18% shows downstream business impact — customer experience measurably improved.",
          "Training ROI is demonstrable at all Kirkpatrick levels. Programme should be scaled to all regions."
        ],
        verdict: "✅ High-effectiveness training — credit quality and customer outcomes both improved. Scale recommended."
      },
      {
        kind: "quiz",
        question: "A bank measures the reduction in NPA formation rate among a cohort of credit officers 6 months after a credit risk training programme. Which Kirkpatrick level is being assessed?",
        opts: ["Level 1 – Reaction", "Level 2 – Learning", "Level 3 – Behaviour", "Level 4 – Results"],
        correct: 3,
        why: "Level 4 (Results) measures tangible, quantifiable business outcomes — reduction in NPA formation is a direct financial result. Level 3 (Behaviour) would be measured by observing whether managers apply better appraisal practices. Level 4 captures the downstream financial impact."
      }
    ]
  },
  {
    id: "L-ABM-B3",
    topicId: "T-ABM-B3",
    subjectId: "ABM",
    title: "Motivation Theories & Leadership Styles",
    badge: "HRM · Behavioural",
    time: "5 min",
    emoji: "⚡",
    steps: [
      {
        kind: "concept",
        title: "Content Theories of Motivation",
        body: "Content theories focus on what internal needs motivate behaviour. Maslow's Hierarchy of Needs (5 levels: Physiological → Safety → Social/Belonging → Esteem → Self-Actualization) argues lower-level needs must be satisfied before higher-level needs motivate. Herzberg's Two-Factor Theory distinguishes Hygiene Factors (salary, job security, working conditions, bank policy — prevent dissatisfaction but do NOT motivate) from Motivators (achievement, recognition, responsibility, growth, challenging work — genuinely drive performance). For bank officers, pension and job security are hygiene; complex credit cases and promotions are true motivators.",
        highlight: "Maslow: 5 levels (Physiological→Self-Actualization) | Herzberg: Hygiene ≠ motivation; only Motivators drive performance"
      },
      {
        kind: "pillars",
        title: "Process Theories of Motivation",
        pillars: [
          { e: "⚖️", n: "Equity Theory (Adams)", d: "Employees compare their Input:Outcome ratio with peers. Perceived inequity → reduced effort or demand for pay revision. Critical in PSB wage revision negotiations." },
          { e: "🎯", n: "Expectancy Theory (Vroom)", d: "Motivation = Expectancy (effort → performance) × Instrumentality (performance → reward) × Valence (reward is valued). All three must be positive for motivation." },
          { e: "🏆", n: "Goal-Setting Theory (Locke)", d: "Specific, Measurable, Achievable, Relevant, Time-bound (SMART) goals improve performance. Foundation of BSC target-setting for branch managers." }
        ]
      },
      {
        kind: "concept",
        title: "Leadership Styles — Situational Leadership",
        body: "Hersey-Blanchard's Situational Leadership model argues the best leadership style depends on employee readiness (competence + commitment): S1 Telling (low readiness — direct, close supervision; suitable for new recruits making KYC errors), S2 Selling (some competence, variable commitment — explain and persuade), S3 Participating (high competence, variable commitment — collaborate, support), S4 Delegating (high competence and commitment — empower fully; suitable for experienced credit officers). Blake-Mouton's Managerial Grid: Team Leader (9,9 — high task + high people) is the ideal banking manager style.",
        highlight: "S1 Telling: New recruits | S2 Selling: Developing staff | S3 Participating: Experienced but reluctant | S4 Delegating: High performers"
      },
      {
        kind: "scenario",
        title: "Applying Motivation & Leadership Theory",
        problem: "Scenario A: Senior credit officer (7 years experience, strong track record) declines promotion citing excessive workload. Scenario B: Junior recruit (3 months) making repeated errors in loan documentation.",
        steps: [
          "Scenario A — High competence, low commitment: Herzberg analysis — is Motivator (recognition, growth, challenge) missing? Check Equity perception vs. peers. Apply S3 Participating style — involve in decision, address workload concern collaboratively.",
          "Scenario B — Low competence, high commitment: Apply S1 Telling — direct, structured guidance. SMART goals (Locke). Enrol in targeted training (Kirkpatrick L2). Close daily supervision.",
          "Different employee readiness levels demand completely different leadership responses — confirms Situational Leadership."
        ],
        verdict: "✅ Match leadership style and motivational intervention to individual employee readiness — not a universal approach."
      },
      {
        kind: "quiz",
        question: "According to Herzberg's Two-Factor Theory, which of the following is classified as a HYGIENE factor in a banking context?",
        opts: [
          "Being assigned to a high-value complex credit case",
          "Receiving a best-officer performance award",
          "Promotion to Branch Manager with wider responsibilities",
          "Guaranteed pension scheme and secure employment"
        ],
        correct: 3,
        why: "Hygiene factors (salary, job security, pension, working conditions, bank policies) prevent dissatisfaction when present but do NOT motivate when added. Only Motivators (recognition, achievement, responsibility, growth) generate genuine motivation. In PSBs, pension and job security are hygiene — taken for granted; challenging assignments and recognition are the true motivators."
      }
    ]
  },
  {
    id: "L-ABM-B4",
    topicId: "T-ABM-B4",
    subjectId: "ABM",
    title: "Organisational Behaviour & Change Management",
    badge: "HRM · Organisation",
    time: "3 min",
    emoji: "🔄",
    steps: [
      {
        kind: "concept",
        title: "Organisational Structures in Banking",
        body: "Banks operate under formal structures. Functional Structure organises by specialisation (credit, treasury, retail, operations, compliance) — efficient but siloed, slow cross-functional response. Divisional Structure groups by business line (retail banking, corporate banking, wealth management, MSME) — customer-centric but resource duplication. Matrix Structure overlays functional and divisional reporting — flexible, used in large global banks for project-based work. Flat structures (fewer hierarchy levels) are emerging in digital-first banks for faster decision-making. Span of Control: the number of direct reports per manager — wide span in digital banks, narrow in traditional hierarchies.",
        highlight: "Span of Control: Wide (digital banks, flat) → faster decisions | Narrow (traditional PSBs) → tighter supervision"
      },
      {
        kind: "pillars",
        title: "Lewin's 3-Step Change Model",
        pillars: [
          { e: "🔥", n: "Unfreeze", d: "Create readiness — challenge the status quo, communicate the 'why.' E.g., explain CBS migration rationale and address staff fear of job loss in town halls." },
          { e: "🔄", n: "Change (Move)", d: "Implement new processes, systems, or behaviours. Manage resistance via training and support. E.g., phased CBS Finacle rollout with parallel running." },
          { e: "🧊", n: "Refreeze", d: "Embed the new state permanently — revise appraisals, SOPs, policies to reflect new way of working. Recognise early adopters to reinforce change." }
        ]
      },
      {
        kind: "scenario",
        title: "Managing CBS Migration Resistance",
        problem: "A regional bank merges with a national bank. 2,000 staff must shift from manual branch processes to Finacle CBS. 40% cite fear of job loss; average age of staff is 48 years.",
        steps: [
          "Unfreeze: Town halls explaining strategic rationale (compliance, scale, customer service). Address job security fears with written assurances and redeployment plan.",
          "Change: Batch Finacle training over 6 months; shadow mode (run parallel) for 30 days; dedicated IT helpdesk for queries.",
          "Refreeze: Redesign performance appraisals to include digital transaction targets; award digital champions; update SOPs to CBS-only workflows."
        ],
        verdict: "✅ Lewin's model provides a structured roadmap — resistance managed through communication, training, and reinforcement."
      },
      {
        kind: "quiz",
        question: "In Lewin's Change Management Model, what is the primary purpose of the 'Refreeze' stage?",
        opts: [
          "Identify resistance to change before starting",
          "Train employees in the new process or system",
          "Communicate the urgency and need for change",
          "Stabilise and institutionalise the new behaviours as the accepted norm"
        ],
        correct: 3,
        why: "Refreeze embeds the change permanently — updating policies, appraisal systems, SOPs, and culture so the organisation does not revert. Training belongs to the 'Change (Move)' stage; communicating urgency is the 'Unfreeze' stage."
      }
    ]
  },

  // ─── ABM Module C: Credit Management (additional lessons) ──────────────────
  {
    id: "L-ABM-C2",
    topicId: "T-ABM-C2",
    subjectId: "ABM",
    title: "NPA Management & Resolution",
    badge: "Credit · Recovery · Critical",
    time: "6 min",
    emoji: "🛡️",
    steps: [
      {
        kind: "concept",
        title: "NPA Classification & SMA Framework",
        body: "An NPA (Non-Performing Asset) is a loan where interest or principal remains overdue for more than 90 days (for term loans). Classification ladder: Special Mention Account (SMA-0: 1–30 days overdue, SMA-1: 31–60 days, SMA-2: 61–90 days) → Sub-Standard: NPA for ≤ 12 months → Doubtful: Sub-standard for > 12 months (D1: up to 1 yr, D2: 1–3 yrs, D3: > 3 yrs) → Loss Asset: identified as uncollectable by bank, auditor, or RBI — fully write off. SMA classification under CRILC (Central Repository of Large Credit) is mandatory for exposures ≥ ₹5 Crore.",
        highlight: "SMA-2 → NPA (day 91) → Sub-standard → Doubtful (D1/D2/D3) → Loss Asset | CRILC reporting: ≥₹5 Cr"
      },
      {
        kind: "pillars",
        title: "Provisioning Norms (RBI)",
        pillars: [
          { e: "🟡", n: "Sub-Standard", d: "Unsecured: 25% | Secured: 15% | Infrastructure sub-standard: 20% of outstanding balance." },
          { e: "🟠", n: "Doubtful Assets", d: "Unsecured portion: 100% always. Secured portion: D1 = 25%, D2 = 40%, D3 = 100%." },
          { e: "🔴", n: "Loss Assets", d: "100% provision on entire outstanding. Recommended for write-off from books; partial recovery still pursued." }
        ]
      },
      {
        kind: "concept",
        title: "Resolution Mechanisms — Tool Selection",
        body: "Banks choose resolution tools based on loan size and borrower type: OTS (One Time Settlement) — bank accepts less than full dues as final settlement; effective for small NPAs. SARFAESI Act — seizure and sale of secured assets without court order (NPA > ₹1 Lakh, secured). DRT (Debt Recovery Tribunal) — fast-track legal recovery for dues > ₹20 Lakhs. IBC (Insolvency and Bankruptcy Code 2016) — time-bound 330-day corporate insolvency resolution via NCLT; Committee of Creditors votes on Resolution Plan by 66% majority. ARC (Asset Reconstruction Companies) — banks sell NPA portfolios at a discount (haircut) to ARCs for balance sheet clean-up. Lok Adalat — for smaller amounts (< ₹20 Lakhs), amicable settlement without litigation.",
        highlight: "IBC: 330 days total | NCLT → IRP → CoC (66% vote) | DRT: >₹20 Lakh | Lok Adalat: <₹20 Lakh"
      },
      {
        kind: "scenario",
        title: "Provisioning Calculation — Doubtful Asset",
        problem: "Account classification: Doubtful-2 (D2) | Outstanding balance = ₹50 Cr | Realisable security value = ₹20 Cr.",
        steps: [
          "Secured portion = ₹20 Cr (covered by realisable security)",
          "Unsecured portion = ₹50 Cr − ₹20 Cr = ₹30 Cr",
          "Provision on secured (D2 rate = 40%) = 40% × 20 = ₹8 Cr",
          "Provision on unsecured (always 100%) = 100% × 30 = ₹30 Cr",
          "Total provision = ₹8 + ₹30 = ₹38 Cr (76% of total exposure)"
        ],
        verdict: "⚠ ₹38 Cr provision on ₹50 Cr exposure — significant capital drain. Evaluate IBC or ARC route for faster resolution."
      },
      {
        kind: "concept",
        title: "IBC Process — Key CAIIB Points",
        body: "Under IBC 2016, when a financial creditor (bank) files an application before NCLT citing default, the NCLT admits the case and appoints an Interim Resolution Professional (IRP). The Corporate Insolvency Resolution Process (CIRP) triggers an automatic moratorium — all pending suits and proceedings against the company are frozen. The Committee of Creditors (CoC), comprising all financial creditors, approves a Resolution Plan by 66% vote of the total CoC value. If no viable plan is approved within 330 days (inclusive of permitted litigation time), the company proceeds to Liquidation. Liquidation waterfall: CIRP costs → Secured financial creditors → Unsecured creditors → Government dues → Equity shareholders (last).",
        highlight: "CIRP Moratorium: all proceedings frozen | CoC: 66% approval | Liquidation waterfall: CIRP costs first, equity last"
      },
      {
        kind: "quiz",
        question: "A Doubtful-1 (D1) account has outstanding dues of ₹10 Cr with realisable security of ₹4 Cr. What is the TOTAL provision required?",
        opts: ["₹1 Cr", "₹7 Cr", "₹10 Cr", "₹4 Cr"],
        correct: 1,
        why: "D1 provisioning: Secured portion (₹4 Cr) at 25% = ₹1 Cr. Unsecured portion (₹6 Cr) at 100% = ₹6 Cr. Total = ₹1 + ₹6 = ₹7 Cr. Note: the unsecured portion of all Doubtful assets always attracts 100% provision regardless of D1/D2/D3 classification."
      }
    ]
  },
  {
    id: "L-ABM-C3",
    topicId: "T-ABM-C3",
    subjectId: "ABM",
    title: "Credit Risk Rating Frameworks",
    badge: "Credit · Risk Assessment",
    time: "4 min",
    emoji: "⭐",
    steps: [
      {
        kind: "concept",
        title: "Internal Credit Rating Models (ICRM)",
        body: "Credit risk rating assesses the probability of default by a borrower and assigns a risk grade that drives pricing, monitoring frequency, and provisioning. For large corporates, banks use Internal Credit Rating Models (ICRM) based on: (a) Financial parameters — DSCR, current ratio, D/E ratio, profitability, (b) Management quality, (c) Industry outlook and competitive position, (d) Group/conglomerate strength. For retail and SME borrowers, Credit Scoring models (CIBIL — range 300–900) use historical repayment behaviour, credit utilisation, account age, and enquiries.",
        highlight: "CIBIL ≥ 750: Low risk | 700–749: Medium | 600–699: High | <600: Very high | 300: No/poor history"
      },
      {
        kind: "pillars",
        title: "Key Financial Ratios in Credit Appraisal",
        pillars: [
          { e: "💧", n: "Liquidity", d: "Current Ratio ≥ 1.33 (working capital loans); Quick Ratio ≥ 1.0. Measures ability to meet short-term obligations from liquid assets." },
          { e: "⚖️", n: "Leverage", d: "Debt-Equity Ratio ≤ 2:1 for most industries. Interest Coverage Ratio ≥ 1.5x. Measures financial risk and debt burden." },
          { e: "📈", n: "Profitability & Serviceability", d: "DSCR ≥ 1.25x for project/term loans; Net Profit Margin, Asset Turnover. Indicates capacity to repay from operations." }
        ]
      },
      {
        kind: "scenario",
        title: "Internal Credit Rating — Risk Grade Assignment",
        problem: "Corporate borrower: DSCR = 1.35 | Current Ratio = 1.45 | Debt-Equity Ratio = 1.8:1 | Net Profit Margin = 9% | Industry Outlook: Stable | Management: Experienced, track record of 15 years.",
        steps: [
          "DSCR 1.35 > 1.25 benchmark → Repayment capacity: ADEQUATE",
          "Current Ratio 1.45 > 1.33 → Short-term liquidity: COMFORTABLE",
          "D/E 1.8:1 < 2.0:1 limit → Leverage: ACCEPTABLE",
          "NPM 9% — solid for the sector; management quality rated HIGH",
          "Composite Internal Rating: BBB+ (Investment Grade) → Sanction at standard pricing; quarterly DSCR monitoring covenant"
        ],
        verdict: "✅ Creditworthy at BBB+ — sanction with standard covenants. Decline or restructure if DSCR falls below 1.1x."
      },
      {
        kind: "concept",
        title: "Risk-Based Pricing (RBP)",
        body: "Under Risk-Based Pricing, interest rates on loans are linked directly to the borrower's credit risk grade. Higher-rated (lower-risk) borrowers receive lower spreads over MCLR or external benchmark lending rate (EBLR — repo-linked); lower-rated (higher-risk) borrowers pay higher spreads to compensate the bank for elevated default probability. RBI mandates all floating rate retail and MSME loans to be linked to an external benchmark (RBI repo, 3-month T-bill, etc.) since October 2019. Formula: Total Lending Rate = External Benchmark Rate + Spread (Credit Risk Premium + Operational Cost).",
        highlight: "EBLR = RBI Repo Rate + Spread | Spread = Credit Risk Premium + Operational Cost | Resets at least quarterly"
      },
      {
        kind: "quiz",
        question: "A borrower's internal credit rating is downgraded from 'A' to 'BB' (sub-investment grade). Under Risk-Based Pricing, what is the most appropriate immediate bank action?",
        opts: [
          "Maintain the same lending rate — changes apply only at next renewal",
          "Increase the credit risk spread and enhance monitoring frequency",
          "Classify the account as NPA immediately",
          "Report to RBI as SMA-2 and initiate SARFAESI"
        ],
        correct: 1,
        why: "Risk-Based Pricing requires adjusting the spread to reflect higher risk — the credit risk premium rises when the rating drops to sub-investment grade. NPA classification requires 90+ days of actual default; RBP adjustments are forward-looking risk management actions at sanction or renewal, not triggered by default."
      }
    ]
  },

  // ─── ABM Module D: Compliance & Governance ─────────────────────────────────
  {
    id: "L-ABM-D1",
    topicId: "T-ABM-D1",
    subjectId: "ABM",
    title: "KYC / AML Framework & Compliance",
    badge: "Compliance · AML · Critical",
    time: "5 min",
    emoji: "🔍",
    steps: [
      {
        kind: "concept",
        title: "KYC Framework — Four Elements",
        body: "KYC (Know Your Customer) is mandated under PMLA 2002 and RBI's Master Directions on KYC. Four key elements: (1) Customer Acceptance Policy (CAP) — defining which customers the bank will onboard; (2) Customer Identification Procedure (CIP) — verifying identity using Officially Valid Documents (OVDs: Aadhaar, PAN, Passport, Voter ID, Driving Licence, NREGA Job Card); (3) Risk Categorisation — Low, Medium, or High risk based on customer type, geography, transaction pattern; (4) Ongoing Transaction Monitoring — screening against sanctioned lists, monitoring unusual patterns.",
        highlight: "CAP → CIP (OVDs) → Risk Category → Ongoing Monitoring | OVDs: Aadhaar, PAN, Passport, Voter ID, DL, NREGA"
      },
      {
        kind: "pillars",
        title: "CTR, STR and CCR Reporting to FIU-IND",
        pillars: [
          { e: "💵", n: "CTR (Cash Transaction Report)", d: "Mandatory report to FIU-IND for all cash transactions above ₹10 Lakh in a single day. All branches submit to FIU monthly." },
          { e: "🚨", n: "STR (Suspicious Transaction Report)", d: "Filed immediately to FIU-IND when transactions appear linked to money laundering or terror financing — no minimum amount. No disclosure to customer." },
          { e: "💴", n: "CCR (Counterfeit Currency Report)", d: "Detection of counterfeit notes — report to local police station and RBI immediately. No threshold." }
        ]
      },
      {
        kind: "concept",
        title: "Risk Categorisation & Periodic Re-KYC",
        body: "RBI KYC Master Directions mandate risk-based periodic re-KYC updates. Low Risk (salaried employees, pensioners, Self-Help Groups): simplified KYC, re-KYC every 10 years. Medium Risk (self-employed, small businesses): re-KYC every 8 years. High Risk (PEPs — Politically Exposed Persons, NRIs from FATF non-compliant countries, shell companies, high-value cash businesses): Enhanced Due Diligence (EDD), Senior Management approval required, re-KYC every 2 years with continuous monitoring. PEPs include current or former heads of state, senior politicians, judicial officers, military officers, and their immediate family members.",
        highlight: "Low Risk: 10 yr re-KYC | Medium: 8 yr | High/PEP: 2 yr | PEP: Senior Mgmt approval + EDD mandatory"
      },
      {
        kind: "scenario",
        title: "STR Trigger Identification — Money Laundering Red Flags",
        problem: "Customer: Salaried IT engineer, monthly salary ₹80,000. Month's transactions: 3 cash deposits of ₹3.5 Lakh each over 3 days → immediate RTGS transfer of ₹10 Lakh to 5 different accounts in different cities. No prior business history.",
        steps: [
          "CTR: Total cash deposit = 3 × ₹3.5 L = ₹10.5 Lakh → CTR threshold (₹10 L/day aggregate) likely crossed → File CTR.",
          "Structuring red flag: Three deposits of ₹3.5 L each appear structured to avoid a single large-amount CTR — classic 'smurfing.'",
          "Rapid RTGS to multiple unknown accounts post-deposit — classic 'layering' stage of money laundering.",
          "Transaction profile completely inconsistent with IT engineer income profile — high suspicion.",
          "Action: File STR immediately to FIU-IND. Consider account freeze pending Principal Officer review."
        ],
        verdict: "🚨 Both CTR and STR required. Probable placement + layering. Escalate to designated Principal Officer immediately."
      },
      {
        kind: "quiz",
        question: "A customer identified as a Politically Exposed Person (PEP) must be subject to which compliance treatment under RBI KYC Master Directions?",
        opts: [
          "Simplified KYC with 10-year periodic renewal",
          "Standard KYC with 8-year review cycle",
          "Enhanced Due Diligence with Senior Management approval and re-KYC every 2 years",
          "Automatic rejection — PEPs cannot open accounts with Indian banks"
        ],
        correct: 2,
        why: "PEPs are classified as High Risk. They require Enhanced Due Diligence (EDD), explicit approval from senior management to open or maintain accounts, and periodic re-KYC every 2 years with continuous transaction monitoring. Refusing to bank PEPs is not the regulatory mandate — proper EDD is."
      }
    ]
  },
  {
    id: "L-ABM-D2",
    topicId: "T-ABM-D2",
    subjectId: "ABM",
    title: "Corporate Governance in Banks",
    badge: "Governance · Compliance",
    time: "4 min",
    emoji: "🏛️",
    steps: [
      {
        kind: "concept",
        title: "Board Structure & RBI Requirements",
        body: "Good corporate governance in banks is mandated under RBI guidelines on Ownership and Governance in Private Sector Banks and the Companies Act 2013. Key RBI requirements: (a) Independent Directors must constitute at least one-third of the Board; (b) MD & CEO role must be separate from Board Chairman; (c) Maximum tenure for MD & CEO: 15 years (in one bank); (d) Mandatory Board Committees: Audit Committee of the Board (ACB), Risk Management Committee (RMC), Nomination & Remuneration Committee (NRC), Stakeholder Relationship Committee (SRC), IT Strategy Committee (ITSC); (e) Non-executive Chairman preferred to separate oversight from management.",
        highlight: "Independent Directors ≥ 1/3 Board | MD&CEO ≠ Chairman | Max MD tenure: 15 yrs | Mandatory: 5 Board committees"
      },
      {
        kind: "pillars",
        title: "OECD Corporate Governance Principles",
        pillars: [
          { e: "🔍", n: "Transparency", d: "Timely, accurate disclosure of financial results, ownership structure, risk appetite, and related-party transactions to all stakeholders." },
          { e: "⚖️", n: "Accountability", d: "Board accountable to shareholders; management accountable to Board via internal audit. Clear audit trails, maker-checker, internal controls." },
          { e: "🛡️", n: "Fairness & Responsibility", d: "Equal treatment of minority shareholders. Social and environmental responsibility — ESG integration increasingly embedded in bank governance frameworks." }
        ]
      },
      {
        kind: "scenario",
        title: "Governance Failure — Red Flag Analysis",
        problem: "Private bank: MD&CEO also chairs the Board. Audit Committee has 2 executive directors and 0 independent directors. A ₹500 Cr related-party loan to promoter's company was approved without independent review.",
        steps: [
          "Violation 1: MD&CEO as Chairman — concentration of power; violates RBI separation mandate → conflict of interest.",
          "Violation 2: Audit Committee with no independent director — violates Companies Act Sec. 177 (ACB must have majority independent directors).",
          "Violation 3: Related-party transaction approved without independent review — governance and conflict-of-interest failure.",
          "Regulatory consequence: RBI may impose Prompt Corrective Action (PCA), seek reconstitution of Board, or restrict dividend payouts."
        ],
        verdict: "❌ Multiple governance violations — regulatory intervention (PCA / Board reconstitution) is probable."
      },
      {
        kind: "quiz",
        question: "Under RBI corporate governance guidelines for private sector banks, what is the minimum proportion of Independent Directors required on the Board?",
        opts: ["One-fourth (25%)", "One-third (33%)", "One-half (50%)", "Two-thirds (67%)"],
        correct: 1,
        why: "RBI mandates Independent Directors constitute at least one-third of the total Board strength. This ensures adequate independence in oversight of management decisions, executive remuneration, and related-party transactions."
      }
    ]
  },
  {
    id: "L-ABM-D3",
    topicId: "T-ABM-D3",
    subjectId: "ABM",
    title: "Fraud Risk Management & Vigilance",
    badge: "Compliance · Fraud Prevention",
    time: "5 min",
    emoji: "🔐",
    steps: [
      {
        kind: "concept",
        title: "RBI Fraud Classification & Reporting Timelines",
        body: "RBI classifies bank frauds under Master Directions on Frauds (2016). Categories include: Misappropriation & Criminal Breach of Trust (most common), Fraudulent Encashment/Manipulation of Books, Unauthorised Credit Facilities (loan sanctioned without authority), Cheating & Forgery, Negligence & Cash Shortages, and Cyber frauds. Reporting timelines: Frauds ₹1 Lakh to ₹5 Crore → report to RBI within 3 weeks of detection. Frauds ≥ ₹5 Crore → Flash Report to RBI within 1 week. Frauds > ₹3 Crore → mandatory CBI referral. All frauds → report to Board's Audit Committee within 15 days.",
        highlight: ">₹5 Cr: Flash Report in 1 week | >₹3 Cr: CBI referral | Board ACB informed in 15 days | No lower limit for STR"
      },
      {
        kind: "pillars",
        title: "Three Lines of Defence Model",
        pillars: [
          { e: "1️⃣", n: "First Line: Business / Operations", d: "Branch staff and operations teams — front-line risk ownership. Adherence to SOPs, maker-checker principle, dual control of cash and valuables, KYC compliance." },
          { e: "2️⃣", n: "Second Line: Risk & Compliance", d: "Risk management and compliance functions — set policies, conduct transaction monitoring, report exceptions to Board. Fully independent of business lines." },
          { e: "3️⃣", n: "Third Line: Internal Audit", d: "Independent assurance to Board and Audit Committee. Audits both first and second line effectiveness. Findings directly to ACB, bypassing management." }
        ]
      },
      {
        kind: "concept",
        title: "Vigilance Machinery in PSBs",
        body: "Public Sector Banks operate under oversight of the Central Vigilance Commission (CVC). Each PSB has a Chief Vigilance Officer (CVO) who liaises with CVC. Preventive Vigilance focuses on systemic improvements — identifying process gaps that enable fraud. Punitive Vigilance investigates detected fraud cases involving staff and initiates disciplinary action. The Caution List (maintained by IBA/RBI) flags borrowers convicted of fraud — barred from fresh bank credit. Staff found guilty may face suspension, dismissal, and criminal prosecution under Prevention of Corruption Act 1988.",
        highlight: "CVC → CVO (in each PSB) | Preventive Vigilance: process improvement | Punitive: staff investigation | Caution List: fraud bar"
      },
      {
        kind: "scenario",
        title: "Fraud Response Protocol",
        problem: "Branch manager discovers today that a credit officer approved ₹8 Crore in loans to fictitious entities using forged Aadhaar and ITR documents. Funds have been withdrawn in full.",
        steps: [
          "Classification: Fraudulent Credit Facilities + Forgery — RBI-reportable fraud above ₹5 Crore.",
          "Immediate: Flash Report to RBI within 1 week. Lodge FIR with police and make mandatory CBI referral (>₹3 Crore).",
          "Internal: Suspend the credit officer with immediate effect pending departmental enquiry. Invoke fidelity insurance.",
          "SARFAESI/DRT: Initiate recovery proceedings on any identifiable linked assets. Report to CIBIL — blacklist the fictitious entities.",
          "Board ACB notification within 15 days. Conduct root-cause analysis and plug process gap (maker-checker failure on KYC verification)."
        ],
        verdict: "🚨 Flash Report + CBI referral mandatory. Board must be informed. Staff suspension and fidelity claim to be initiated."
      },
      {
        kind: "quiz",
        question: "A bank detects a ₹7 Crore fraud involving forged property documents. Which combination of regulatory obligations is MANDATORY?",
        opts: [
          "Report to RBI within 3 weeks only",
          "Flash Report to RBI within 1 week AND CBI referral",
          "Internal investigation for 30 days, then RBI report",
          "Report to local police only — RBI reporting threshold is ₹10 Crore"
        ],
        correct: 1,
        why: "Frauds ≥ ₹5 Crore require a Flash Report to RBI within 1 week of detection. Additionally, all frauds above ₹3 Crore must be mandatorily referred to the CBI for investigation. Both obligations apply to a ₹7 Crore fraud."
      }
    ]
  }
];

export const FORMULAS = [
  // BFM
  { id: "F-BFM1", sub: "BFM", tag: "Basel III", name: "Capital Adequacy Ratio (CRAR)", f: "(Tier I Capital + Tier II Capital) / RWA × 100", note: "Regulatory Min: 9% (RBI) | 8% (Basel III Accord). Must be supported by CET1 of at least 5.5%." },
  { id: "F-BFM2", sub: "BFM", tag: "Liquidity", name: "Liquidity Coverage Ratio (LCR)", f: "HQLA / Net Cash Outflows over 30 days × 100", note: "Min 100%. Ensures a bank holds liquid assets to survive a severe 30-day liquidity stress event." },
  { id: "F-BFM3", sub: "BFM", tag: "Liquidity", name: "Net Stable Funding Ratio (NSFR)", f: "Available Stable Funding (ASF) / Required Stable Funding (RSF) × 100", note: "Min 100%. Structural, 1-year liquidity horizon check." },
  { id: "F-BFM4", sub: "BFM", tag: "Bonds", name: "Modified Duration (MD)", f: "Macaulay Duration / (1 + YTM / n)", note: "Measures percentage change in bond price for a 1% change in yield. Direct price sensitivity index." },
  { id: "F-BFM5", sub: "BFM", tag: "Risk", name: "Value at Risk (VaR)", f: "Mean Return (μ) − (z-score × Standard Deviation (σ)) × √t", note: "Common z-scores: 1.65 (90% confidence), 1.96 (95% confidence), 2.33 (99% confidence)." },
  // ABM
  { id: "F-ABM1", sub: "ABM", tag: "Credit", name: "Debt Service Coverage Ratio (DSCR)", f: "(Net Profit + Depreciation + Interest on Long-Term Debt) / (Installments + Interest on Long-Term Debt)", note: "Indicates capacity to service debt. Ideal benchmark is 1.25x to 1.5x in project lending." },
  { id: "F-ABM2", sub: "ABM", tag: "Credit", name: "Tandon MPBF Method I", f: "0.75 × (Current Assets − Current Liabilities excluding Bank Borrowings)", note: "Borrower brings in 25% of working capital gap as Net Working Capital (NWC)." },
  { id: "F-ABM3", sub: "ABM", tag: "Credit", name: "Tandon MPBF Method II", f: "(0.75 × Current Assets) − Current Liabilities excluding Bank Borrowings", note: "Borrower funds 25% of Current Assets as margin from long term sources." },
  // ABFM
  { id: "F-ABFM1", sub: "ABFM", tag: "Valuation", name: "CAPM Cost of Equity", f: "Rf + Beta (β) × (Rm − Rf)", note: "Rf = Risk-free rate, Rm = Market rate, (Rm - Rf) = Equity/Market Risk Premium." },
  { id: "F-ABFM2", sub: "ABFM", tag: "Valuation", name: "Net Present Value (NPV)", f: "Σ [ Cash Flow_t / (1 + r)^t ] − Initial Investment", note: "Accept project if NPV > 0. Discounting factor r is typically the WACC." },
  { id: "F-ABFM3", sub: "ABFM", tag: "Valuation", name: "Weighted Average Cost of Capital (WACC)", f: "(E/V × Ke) + (D/V × Kd × (1 − T))", note: "Ke = Cost of equity, Kd = Cost of debt, T = tax rate, E = Equity value, D = Debt value, V = E+D." },
  // Additional ABM credit & economics formulas
  { id: "F-ABM4", sub: "ABM", tag: "Credit", name: "Nayak Committee Working Capital (Turnover Method)", f: "Bank WC Limit = 20% of Projected Annual Turnover | Borrower Margin = 5% of Turnover", note: "Applicable for MSME credit limits up to ₹7.5 Crore (revised 2026). Simple method — no detailed CMA data required." },
  { id: "F-ABM5", sub: "ABM", tag: "NPA", name: "Gross NPA Ratio", f: "(Gross NPA / Gross Advances) × 100", note: "Key asset quality indicator. <5%: healthy | 5–10%: moderate stress | >10%: poor. Watched by RBI, investors, and rating agencies." },
  { id: "F-ABM6", sub: "ABM", tag: "NPA", name: "Net NPA Ratio", f: "(Gross NPA − Provisions Held) / (Gross Advances − Provisions Held) × 100", note: "Reflects true uncovered NPA exposure net of provisions. Lower Net NPA = stronger provision coverage." },
  { id: "F-ABM7", sub: "ABM", tag: "NPA", name: "Provision Coverage Ratio (PCR)", f: "(Cumulative Provisions on NPA / Gross NPA) × 100", note: "RBI desirable PCR: ≥ 70%. Higher PCR means the bank is better cushioned against actual credit losses." },
  { id: "F-ABM8", sub: "ABM", tag: "Credit", name: "Current Ratio", f: "Current Assets / Current Liabilities", note: "Working capital health. RBI benchmark for fund-based WC limit sanction: ≥ 1.33 (i.e., NWC ≥ 25% of Current Assets)." },
  { id: "F-ABM9", sub: "ABM", tag: "Credit", name: "Debt-Equity Ratio (Leverage)", f: "Total Long-Term Debt / Tangible Net Worth (Equity)", note: "Acceptable range: ≤ 2:1 for manufacturing; infrastructure may permit up to 3:1. Higher ratio = higher financial leverage risk." },
  { id: "F-ABM10", sub: "ABM", tag: "Credit", name: "Interest Coverage Ratio (ICR / TIE)", f: "EBIT / Annual Interest Expense", note: "Measures ability to service interest from operating profit. Minimum acceptable: ≥ 1.5x; preferred for term loans: ≥ 2.5x." },
  { id: "F-ABM11", sub: "ABM", tag: "Economics", name: "Real GDP (Deflated)", f: "Real GDP = Nominal GDP / (GDP Deflator / 100)", note: "Removes price level distortion. Real GDP growth is the true measure of economic expansion used in monetary policy formulation." },
  { id: "F-ABM12", sub: "ABM", tag: "Economics", name: "Fiscal Deficit & Primary Deficit", f: "Fiscal Deficit = Total Expenditure − (Revenue Receipts + Non-Debt Capital Receipts) | Primary Deficit = Fiscal Deficit − Interest Payments", note: "FRBM 2003 target: Fiscal Deficit ≤ 3% of GDP. Primary Deficit → Zero is the ideal for long-run debt sustainability." }
];

export const RBI_CIRCULARS = [
  {
    id: "CIRC-001",
    date: "May 2026",
    title: "Prudential Norms on Risk Weights for Consumer Credit",
    summary: "RBI increased risk weights on unsecured retail consumer loans (credit cards, personal loans) from 100% to 125% for banks, urging higher capital buffers. Housing, education, and vehicle loans remain exempt.",
    relevance: 95,
    tag: "BFM · Capital Requirements",
    subjectId: "BFM",
    topicId: "T-BFM-B1"
  },
  {
    id: "CIRC-002",
    date: "April 2026",
    title: "Master Direction – Liquidity Risk Management Framework",
    summary: "Stricter reporting rules for daily LCR monitoring. RBI mandates banks to conduct stress tests reflecting sudden online banking withdrawal panic, adjusting retail deposit run-off assumptions.",
    relevance: 90,
    tag: "BFM · ALM & Liquidity",
    subjectId: "BFM",
    topicId: "T-BFM-D1"
  },
  {
    id: "CIRC-003",
    date: "March 2026",
    title: "Revision in NPA Classification Guidelines under MSME Act",
    summary: "Revises threshold rules for classifying stressed MSME accounts. Restructuring proposals can be implemented within 180 days of standard account classification under specialized bank committees.",
    relevance: 88,
    tag: "ABM · Credit Management",
    subjectId: "ABM",
    topicId: "T-ABM-C2"
  },
  {
    id: "CIRC-004",
    date: "May 2026",
    title: "Framework for Cyber Security Incident Reporting",
    summary: "Mandates reporting of all security breaches, ransomware threats, and DDoS events to RBI and CERT-In within 6 hours of detection, with compulsory root-cause analysis submittals in 15 days.",
    relevance: 92,
    tag: "IT · Cybersecurity",
    subjectId: "IT",
    topicId: "T-IT-C1"
  },
  {
    id: "CIRC-005",
    date: "March 2026",
    title: "Master Directions on KYC — Periodic Re-KYC & Video KYC (V-CIP)",
    summary: "RBI revised periodic KYC update intervals: Low-risk customers every 10 years, medium-risk every 8 years, high-risk (including PEPs) every 2 years. Video Customer Identification Process (V-CIP) is now a mandatory option for digital account opening. Aadhaar-based e-KYC via OTP and biometric authentication explicitly permitted for seamless onboarding.",
    relevance: 93,
    tag: "ABM · KYC / AML Compliance",
    subjectId: "ABM",
    topicId: "T-ABM-D1"
  },
  {
    id: "CIRC-006",
    date: "April 2026",
    title: "Revised Guidelines on Corporate Governance in Private Sector Banks",
    summary: "RBI mandated formal separation of MD & CEO role from Board Chairperson in all private sector banks. Part-time Chairman must be a non-executive director. Independent directors must form at least one-third of the Board. Cooling-off period of 3 years introduced for former bank employees seeking Board positions. Maximum MD & CEO tenure capped at 15 years in a single bank.",
    relevance: 87,
    tag: "ABM · Corporate Governance",
    subjectId: "ABM",
    topicId: "T-ABM-D2"
  },
  {
    id: "CIRC-007",
    date: "February 2026",
    title: "Enhancement in Fraud Reporting Framework — Digital & Cyber Frauds",
    summary: "RBI expanded the fraud classification framework to cover new digital fraud categories: SIM swap attacks, business email compromise (BEC), and deepfake-based social engineering frauds. Flash reporting timeline reduced to 6 hours for cyber frauds above ₹5 Crore. Banks must retain fraud incident logs for 180 days and make them accessible to RBI inspection teams. Dedicated fraud risk officer role mandated in banks with total assets above ₹10,000 Crore.",
    relevance: 91,
    tag: "ABM · Fraud Risk Management",
    subjectId: "ABM",
    topicId: "T-ABM-D3"
  },
  {
    id: "CIRC-008",
    date: "January 2026",
    title: "Working Capital Assessment for MSME — Nayak Committee Turnover Limit Revision",
    summary: "RBI revised the Nayak Committee turnover method applicability threshold from ₹5 Crore to ₹7.5 Crore for MSME borrowers. Banks may adopt the Projected Turnover method (20% of projected annual turnover as working capital limit; 5% as borrower margin) for limits up to ₹7.5 Crore without requiring full CMA data. Borrowers above ₹7.5 Crore must submit detailed CMA data and follow Tandon Committee methods.",
    relevance: 88,
    tag: "ABM · Credit Management",
    subjectId: "ABM",
    topicId: "T-ABM-C1"
  }
];

// Helper functions for easy content queries
export function getTopicsForModule(moduleId) {
  return TOPICS[moduleId] || [];
}

export function getLessonsForSubject(subjectId) {
  return MICRO_LESSONS.filter(l => l.subjectId === subjectId);
}

export function getFormulasForSubject(subjectId) {
  return FORMULAS.filter(f => f.sub === subjectId);
}

export function getCircularsForSubject(subjectId) {
  return RBI_CIRCULARS.filter(c => c.subjectId === subjectId);
}
