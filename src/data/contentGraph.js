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
  "ABM-C": [
    { id: "T-ABM-C1", name: "Working Capital Assessment", weightage: "Critical", dependency: [] },
    { id: "T-ABM-C2", name: "NPA Management & Resolution", weightage: "Critical", dependency: [] },
    { id: "T-ABM-C3", name: "Credit Risk Rating Frameworks", weightage: "High", dependency: ["T-ABM-C1"] }
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
  { id: "F-ABFM3", sub: "ABFM", tag: "Valuation", name: "Weighted Average Cost of Capital (WACC)", f: "(E/V × Ke) + (D/V × Kd × (1 − T))", note: "Ke = Cost of equity, Kd = Cost of debt, T = tax rate, E = Equity value, D = Debt value, V = E+D." }
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
