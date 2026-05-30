import { C, font } from "../theme";
import { ArrowLeft } from "lucide-react";
import { APP, SERIES } from "../brand";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>{title}</h2>
    <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>{children}</div>
  </div>
);

const Li = ({ children }) => (
  <li style={{ marginBottom: 4 }}>{children}</li>
);

export default function PrivacyPolicy({ onBack }) {
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
            <h1 style={{ color: C.text, fontSize: 16, fontWeight: 800, margin: 0 }}>Privacy Policy</h1>
            <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>Last updated: 1 June 2026</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 24 }}>
            {SERIES.name} ("{`we`}", "{`us`}", "{`our`}") operates the <strong style={{ color: C.text }}>{APP.name}</strong> mobile application ("App"). This Privacy Policy explains how we collect, use, and protect your information when you use our App. By signing in, you agree to this policy.
          </p>

          <Section title="1. Information We Collect">
            <p style={{ marginBottom: 8 }}>We collect the following information when you use the App:</p>
            <ul style={{ paddingLeft: 20 }}>
              <Li><strong style={{ color: C.text }}>Google Account Data:</strong> Your name, email address, and profile photo, provided by Google Sign-In. We do not have access to your Google password.</Li>
              <Li><strong style={{ color: C.text }}>Study Progress:</strong> Your spaced-repetition card states, session history, subject preferences, and exam readiness scores.</Li>
              <Li><strong style={{ color: C.text }}>Onboarding Profile:</strong> Your banking role, target elective, study hours, and energy profile — used solely to personalise your study experience.</Li>
              <Li><strong style={{ color: C.text }}>Purchase Data:</strong> Subscription and in-app purchase records processed by Google Play. We receive confirmation of purchases but not your payment card details.</Li>
              <Li><strong style={{ color: C.text }}>Referral Data:</strong> If you use or share a referral code, we record the referral relationship to calculate commissions.</Li>
              <Li><strong style={{ color: C.text }}>Usage Analytics:</strong> Anonymous event data (screens visited, features used) collected via Google Firebase Analytics.</Li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul style={{ paddingLeft: 20 }}>
              <Li>To sync your study progress across devices.</Li>
              <Li>To personalise your study plan, subject ordering, and revision queue.</Li>
              <Li>To send push notifications reminding you of due revision cards (you may disable these in device settings).</Li>
              <Li>To calculate and pay referral commissions.</Li>
              <Li>To verify subscription status and unlock premium content.</Li>
              <Li>To improve the App through anonymised analytics.</Li>
              <Li>To respond to support requests.</Li>
            </ul>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>Your data is stored in Google Firebase (Firestore), a secure cloud database operated by Google LLC. Firebase is ISO 27001 certified and SOC 2/3 compliant. Data is encrypted in transit (TLS) and at rest.</p>
            <p style={{ marginTop: 8 }}>Access to your Firestore data is restricted by security rules — only your own account can read or write your records.</p>
          </Section>

          <Section title="4. Third-Party Services">
            <p style={{ marginBottom: 8 }}>The App uses the following third-party services, each governed by their own privacy policies:</p>
            <ul style={{ paddingLeft: 20 }}>
              <Li><strong style={{ color: C.text }}>Google Firebase</strong> — Authentication, Firestore database, Analytics. <a href="https://firebase.google.com/support/privacy" style={{ color: C.accent }}>Firebase Privacy</a></Li>
              <Li><strong style={{ color: C.text }}>Google Play Billing</strong> — Subscription and payment processing. <a href="https://policies.google.com/privacy" style={{ color: C.accent }}>Google Privacy Policy</a></Li>
              <Li><strong style={{ color: C.text }}>Google Gemini API</strong> — AI-generated case studies and coaching (routed through our server; your personal data is never sent to Gemini).</Li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. We share data only in the following cases:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <Li>With Google (Firebase / Play) as required to operate the service.</Li>
              <Li>If required by law, court order, or regulatory authority.</Li>
              <Li>In aggregate, anonymised form for product improvement.</Li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <Li><strong style={{ color: C.text }}>Access</strong> your data — email us and we will export your study records.</Li>
              <Li><strong style={{ color: C.text }}>Delete</strong> your account — email us to permanently delete all data within 30 days.</Li>
              <Li><strong style={{ color: C.text }}>Opt out</strong> of analytics — disable in device app settings.</Li>
              <Li><strong style={{ color: C.text }}>Withdraw consent</strong> — sign out at any time; your local data remains on the device until you uninstall.</Li>
            </ul>
          </Section>

          <Section title="7. Children's Privacy">
            <p>The App is intended for adult banking professionals preparing for the CAIIB examination. We do not knowingly collect data from users under 18. If you believe a minor has used the App, contact us for immediate deletion.</p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We will notify you of material changes via a notice in the App. Continued use after notification constitutes acceptance.</p>
          </Section>

          <Section title="9. Contact">
            <p>For privacy questions, data requests, or account deletion:</p>
            <p style={{ marginTop: 8 }}>
              <strong style={{ color: C.text }}>Email:</strong> <a href={`mailto:${SERIES.email.privacy}`} style={{ color: C.accent }}>{SERIES.email.privacy}</a><br />
              <strong style={{ color: C.text }}>Company:</strong> {SERIES.company}<br />
              <strong style={{ color: C.text }}>App:</strong> {APP.name} ({APP.packageId})
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
