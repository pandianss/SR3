import { C, font } from "../theme";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>{title}</h2>
    <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>{children}</div>
  </div>
);

const Li = ({ children }) => (
  <li style={{ marginBottom: 4 }}>{children}</li>
);

export default function TermsOfService({ onBack }) {
  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", background: C.surf, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: C.surf, zIndex: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: C.muted, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={18} color={C.muted} />
            </button>
          )}
          <div>
            <h1 style={{ color: C.text, fontSize: 16, fontWeight: 800, margin: 0 }}>Terms of Service</h1>
            <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>Last updated: 1 June 2026</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 24 }}>
            These Terms of Service ("Terms") govern your use of the <strong style={{ color: C.text }}>CAIIB Prep</strong> application operated by SuperRecall ("we", "us"). By creating an account, you agree to these Terms. If you do not agree, do not use the App.
          </p>

          <Section title="1. The Service">
            <p>CAIIB Prep is an exam preparation platform for banking professionals appearing in the Certified Associate of the Indian Institute of Bankers (CAIIB) examination. The App provides study content, spaced-repetition tools, AI-generated case studies, and RBI circular summaries for educational purposes.</p>
            <p style={{ marginTop: 8 }}>
              <strong style={{ color: C.text }}>Disclaimer:</strong> The App is an independent study aid. It is not affiliated with, endorsed by, or officially connected to IIBF (Indian Institute of Banking and Finance). Exam patterns and syllabi may change; always verify with official IIBF sources.
            </p>
          </Section>

          <Section title="2. Account & Eligibility">
            <ul style={{ paddingLeft: 20 }}>
              <Li>You must be at least 18 years old to use the App.</Li>
              <Li>You must provide accurate information during sign-in.</Li>
              <Li>You are responsible for maintaining the security of your Google account.</Li>
              <Li>One account per person. Creating multiple accounts to abuse referral codes is prohibited.</Li>
            </ul>
          </Section>

          <Section title="3. Subscriptions & Payments">
            <p style={{ marginBottom: 8 }}>Premium features are available via a subscription processed through Google Play Billing.</p>
            <ul style={{ paddingLeft: 20 }}>
              <Li><strong style={{ color: C.text }}>Billing:</strong> Subscriptions are billed monthly or annually as selected. Your Google Play account is charged at the start of each period.</Li>
              <Li><strong style={{ color: C.text }}>Auto-renewal:</strong> Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.</Li>
              <Li><strong style={{ color: C.text }}>Cancellation:</strong> Cancel anytime in Google Play → Subscriptions. Access continues until the end of the paid period.</Li>
              <Li><strong style={{ color: C.text }}>Refunds:</strong> Refund requests are handled by Google Play in accordance with their refund policy. We do not issue refunds directly. For issues, contact <a href="mailto:support@superrecall.in" style={{ color: C.accent }}>support@superrecall.in</a>.</Li>
              <Li><strong style={{ color: C.text }}>Price changes:</strong> We will notify you 30 days in advance of any subscription price changes.</Li>
            </ul>
          </Section>

          <Section title="4. Referral Programme">
            <ul style={{ paddingLeft: 20 }}>
              <Li>Each user receives one unique referral code upon completing onboarding.</Li>
              <Li>When a referred user makes a qualifying purchase, the referrer earns 15% of that purchase value as commission.</Li>
              <Li>Commissions are paid via UPI once the balance exceeds ₹100. Payouts are processed within 30 days of request.</Li>
              <Li>We reserve the right to withhold commissions earned through fraudulent activity, self-referrals, or abuse of the referral system.</Li>
              <Li>Commission rates and payout thresholds may be changed with 30 days' notice.</Li>
            </ul>
          </Section>

          <Section title="5. Acceptable Use">
            <p style={{ marginBottom: 8 }}>You agree not to:</p>
            <ul style={{ paddingLeft: 20 }}>
              <Li>Reverse-engineer, decompile, or scrape the App or its content.</Li>
              <Li>Share your account or subscription with others.</Li>
              <Li>Reproduce or redistribute study content without written permission.</Li>
              <Li>Use the App to spread misinformation about CAIIB examinations.</Li>
              <Li>Attempt to circumvent subscription checks or access paywalled content without payment.</Li>
              <Li>Create fake accounts or manipulate the referral system.</Li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>All study content, formulas, lesson structures, UI designs, and AI-generated materials within the App are owned by SuperRecall or its licensors. The CAIIB syllabus structure is derived from publicly available IIBF documents. You may use content solely for your personal, non-commercial exam preparation.</p>
          </Section>

          <Section title="7. AI-Generated Content">
            <p>Some case studies, explanations, and coaching responses are generated by AI (Google Gemini). While we review content quality, AI-generated material may occasionally contain errors. Do not rely solely on AI content for exam preparation — always cross-reference with official IIBF study materials.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the maximum extent permitted by law, SuperRecall is not liable for:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <Li>Exam outcomes — passing or failing the CAIIB examination.</Li>
              <Li>Inaccuracies in study content or AI-generated responses.</Li>
              <Li>Loss of study progress due to device failure or account deletion.</Li>
              <Li>Indirect, incidental, or consequential damages arising from use of the App.</Li>
            </ul>
            <p style={{ marginTop: 8 }}>Our total liability is limited to the amount you paid for the subscription in the 3 months preceding the claim.</p>
          </Section>

          <Section title="9. Termination">
            <p>We may suspend or terminate your account if you breach these Terms, abuse the referral system, or engage in fraudulent activity. Upon termination, access to premium content ceases immediately. We will not refund any unused subscription period in cases of termination for cause.</p>
          </Section>

          <Section title="10. Governing Law">
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>
          </Section>

          <Section title="11. Changes to Terms">
            <p>We may update these Terms. We will notify you via the App at least 14 days before material changes take effect. Continued use after the effective date constitutes acceptance.</p>
          </Section>

          <Section title="12. Contact">
            <p>
              <strong style={{ color: C.text }}>Email:</strong> <a href="mailto:support@superrecall.in" style={{ color: C.accent }}>support@superrecall.in</a><br />
              <strong style={{ color: C.text }}>Company:</strong> SuperRecall<br />
              <strong style={{ color: C.text }}>App:</strong> CAIIB Prep (com.superrecall.caiib)
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
