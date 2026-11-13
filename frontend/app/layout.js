import "./tailwind.css";

export const metadata = {
  title: "TrustHire — AI-Assisted Candidate Fraud Detection & Verification",
  description: "Identify candidate fraud through multi-vector verification powered by Gemma 4 and transparent scoring.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
