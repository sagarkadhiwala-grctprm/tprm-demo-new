import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
          TPRM Automation Demo
        </h1>
        <p className="text-lg sm:text-xl text-secondary mb-10 text-balance">
          AI-powered third-party risk assessment — reducing vendor onboarding
          from weeks to hours
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/onboard"
            className="px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Register New Vendor
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-colors"
          >
            View Risk Dashboard
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <h2 className="font-heading text-2xl font-semibold text-center mb-10">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Register Vendor",
              desc: "Submit vendor profile, data access scope, and business criticality through our intake form.",
            },
            {
              step: "2",
              title: "AI Assessment",
              desc: "Claude generates tailored risk questions and scores responses against enterprise controls.",
            },
            {
              step: "3",
              title: "Risk Report",
              desc: "Receive an AI narrative, key findings, and actionable recommendations in minutes.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-card rounded-xl border border-white/10 p-6 relative"
            >
              <span className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                {item.step}
              </span>
              <h3 className="font-heading text-xl font-semibold mt-4 mb-3">
                {item.title}
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="hidden md:flex items-center justify-center mt-8 text-secondary text-sm gap-4">
          <span>1. Register Vendor</span>
          <span>→</span>
          <span>2. AI Assessment</span>
          <span>→</span>
          <span>3. Risk Report</span>
        </div>
      </section>
    </div>
  );
}
