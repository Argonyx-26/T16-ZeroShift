import React, { useState, useEffect } from 'react';
import PenguMascot from '../components/common/PenguMascot';
import PixelBadge from '../components/common/PixelBadge';
import {
  BookOpen,
  Terminal,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Laptop,
  Puzzle,
  Eye,
  Activity,
  ArrowRight,
  MessageSquare,
  Lock,
  Zap,
} from 'lucide-react';

// Documentation Section Navigation Items
const DOC_SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'what-it-does', title: 'What it does' },
  { id: 'how-it-works', title: 'How it works' },
  { id: 'what-it-needs', title: 'What it needs' },
  { id: 'installation', title: 'Installation' },
  { id: 'starter-kit', title: 'Using a Starter Kit' },
  { id: 'health-check', title: 'Checking it’s Running' },
  { id: 'privacy', title: 'Privacy & Security' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
];

// Reusable Code Block with copy functionality
function CodeBlock({ code, language = 'BASH' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-900 shadow-pixel bg-slate-950 text-slate-100 font-mono text-xs my-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-pixel font-bold uppercase tracking-wider text-slate-300">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-sans text-xs"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-learning" />
              <span className="text-learning font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code contents */}
      <pre className="p-4 overflow-x-auto leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Reusable Callout components
function Callout({ type = 'info', title, children }) {
  const styles = {
    info: 'bg-primary-soft border-primary text-ink',
    tip: 'bg-emerald-50 border-learning text-ink',
    warning: 'bg-amber-50 border-warning text-ink',
    success: 'bg-green-50 border-learning text-ink',
  };

  const icons = {
    info: <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />,
    tip: <Zap className="w-4 h-4 text-learning flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />,
    success: <Check className="w-4 h-4 text-learning flex-shrink-0" />,
  };

  return (
    <div className={`p-4 rounded-xl border-2 shadow-pixel-sm my-4 ${styles[type] || styles.info}`}>
      <div className="flex items-center gap-2 font-pixel text-xs font-bold uppercase tracking-wider mb-1">
        {icons[type]}
        <span>{title || type}</span>
      </div>
      <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-sans">
        {children}
      </div>
    </div>
  );
}

export default function VSCodeDocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [openFaq, setOpenFaq] = useState({});

  const toggleFaq = (key) => {
    setOpenFaq((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Track scroll position to update active navigation item
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const sec of DOC_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
      {/* ============================================================== */}
      {/* 1. DOCS NAVIGATION SIDEBAR (Desktop Sticky, Mobile Pills)      */}
      {/* ============================================================== */}
      <aside className="w-full lg:w-60 flex-shrink-0 lg:sticky lg:top-4 z-20">
        <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-4">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b-2 border-slate-200">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-pixel text-xs font-bold text-ink uppercase tracking-wider">
              Doc Sections
            </h3>
          </div>

          {/* Navigation list */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
            {DOC_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`px-3 py-2 rounded-xl text-left text-xs font-medium whitespace-nowrap transition-all flex items-center justify-between ${
                  activeSection === sec.id
                    ? 'bg-primary text-white font-bold border-2 border-slate-900 shadow-pixel-sm'
                    : 'text-ink-secondary hover:bg-slate-100 hover:text-ink border-2 border-transparent'
                }`}
              >
                <span>{sec.title}</span>
                {activeSection === sec.id && (
                  <ChevronRight className="w-3.5 h-3.5 hidden lg:inline-block ml-1" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN DOCUMENTATION CONTENT                                  */}
      {/* ============================================================== */}
      <div className="flex-1 min-w-0 max-w-3xl space-y-12">
        {/* HERO SECTION */}
        <section id="overview" className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pixel-grid-dots opacity-40 pointer-events-none" />

          <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/30 text-xs font-pixel font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5 text-warning" />
                <span>Developer Companion v1.0</span>
              </div>

              <h1 className="font-pixel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
                Study Companion — Desktop Pet
              </h1>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-sans max-w-xl">
                A little companion that lives on your desktop while you code, watches for common mistakes, and nudges you with a question instead of just handing you the answer.
              </p>
            </div>

            <div className="flex-shrink-0">
              <PenguMascot
                pose="teacher"
                size="md"
                speech="Let's code together!"
                speechPosition="top"
                alt="Pengu Companion"
              />
            </div>
          </div>
        </section>

        {/* SECTION: WHAT IT DOES */}
        <section id="what-it-does" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">What It Does</h2>
            <p className="text-xs text-ink-secondary mt-1">Four core principles of your Socratic coding experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-soft border border-slate-900 flex items-center justify-center text-primary mb-2.5">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">1. Desktop Companion</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Floats on your screen as a small, draggable, always-on-top window. You can drag Pengu anywhere while keeping focus on your editor.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm">
              <div className="w-8 h-8 rounded-lg bg-learning-soft border border-slate-900 flex items-center justify-center text-learning mb-2.5">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">2. Real-Time Coding Feedback</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Reacts in real time while you code in VS Code through the companion's dedicated VS Code extension.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm">
              <div className="w-8 h-8 rounded-lg bg-warning-soft border border-slate-900 flex items-center justify-center text-warning mb-2.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">3. Socratic Guidance</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                When it notices off-by-one errors, missed edge cases, or infinite loops, it does not immediately provide the answer. Instead, it asks a question that helps you reason through the bug.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-slate-900 flex items-center justify-center text-primary mb-2.5">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">4. Stays Quiet</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                If the code has been clean for a while, it rests quietly and does not interrupt your flow state unnecessarily.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: HOW IT WORKS (ARCHITECTURE) */}
        <section id="how-it-works" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">How the System Works</h2>
            <p className="text-xs text-ink-secondary mt-1">Lightweight local communication pipeline.</p>
          </div>

          {/* Architecture Diagram */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border-2 border-slate-900 shadow-pixel-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-pixel-sm w-full md:w-auto">
                <span className="font-pixel text-xs font-bold text-ink">VS Code</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />
              <div className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-pixel-sm w-full md:w-auto">
                <span className="font-pixel text-xs font-bold text-primary">Socratic Extension</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />
              <div className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-pixel-sm w-full md:w-auto">
                <span className="font-mono text-xs font-bold text-slate-600">Local 127.0.0.1</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />
              <div className="p-3 bg-white rounded-xl border-2 border-slate-900 shadow-pixel-sm w-full md:w-auto">
                <span className="font-pixel text-xs font-bold text-learning">Desktop Pet</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />
              <div className="p-3 bg-amber-100 rounded-xl border-2 border-slate-900 shadow-pixel-sm w-full md:w-auto">
                <span className="font-pixel text-xs font-bold text-amber-900">Feedback</span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            The desktop app is the visual companion. The VS Code extension is responsible for observing the currently edited code and sending relevant reactions to the desktop pet.
          </p>
        </section>

        {/* SECTION: WHAT IT NEEDS */}
        <section id="what-it-needs" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">What It Needs to Work</h2>
            <p className="text-xs text-ink-secondary mt-1">Two cooperating software parts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-surface border-2 border-slate-900 shadow-pixel-sm">
              <div className="flex items-center gap-2 mb-2 font-pixel text-xs font-bold text-primary uppercase">
                <Laptop className="w-4 h-4" /> Component A
              </div>
              <h3 className="font-bold text-base text-ink mb-1.5">1. Desktop App</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                The lightweight desktop window rendered via Electron that displays Pengu and hosts the local HTTP bridge on port 4123.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border-2 border-slate-900 shadow-pixel-sm">
              <div className="flex items-center gap-2 mb-2 font-pixel text-xs font-bold text-learning uppercase">
                <Puzzle className="w-4 h-4" /> Component B
              </div>
              <h3 className="font-bold text-base text-ink mb-1.5">2. VS Code Extension</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                The extension that actually reads the actively edited file, analyzes edits for conceptual gaps, and signals the companion.
              </p>
            </div>
          </div>

          <Callout type="info" title="Important Note">
            <strong>Both need to be running.</strong> The desktop app displays what the VS Code extension discovers. If either is closed, feedback pauses cleanly.
          </Callout>
        </section>

        {/* SECTION: INSTALLATION */}
        <section id="installation" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">Installation</h2>
            <p className="text-xs text-ink-secondary mt-1">Quick 5-step local setup.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-md bg-primary text-white font-pixel font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <p className="mt-0.5 text-ink font-medium">Download and unzip the companion application folder.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-md bg-primary text-white font-pixel font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <p className="mt-0.5 text-ink font-medium">Open a terminal in the unzipped folder:</p>
            </div>

            <CodeBlock
              language="BASH"
              code={`cd vscode-pengu/socratic-desktop-companion\nnpm install\nnpm start`}
            />

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-md bg-primary text-white font-pixel font-bold flex items-center justify-center flex-shrink-0 text-xs">
                4
              </span>
              <p className="mt-0.5 text-ink font-medium">
                A small window with Pengu will appear in the bottom-right corner of your screen.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-md bg-primary text-white font-pixel font-bold flex items-center justify-center flex-shrink-0 text-xs">
                5
              </span>
              <p className="mt-0.5 text-ink font-medium">
                Leave the app running while you code.
              </p>
            </div>
          </div>

          <Callout type="tip" title="Pro-Tip">
            The pet can be dragged anywhere on the screen by clicking and holding on Pengu.
          </Callout>
        </section>

        {/* SECTION: USING A STARTER KIT */}
        <section id="starter-kit" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">Using It with a Starter Kit</h2>
            <p className="text-xs text-ink-secondary mt-1">Structured workflow for hands-on exercises.</p>
          </div>

          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            If you downloaded an Argonyx practice starter kit for <strong>DSA</strong>, <strong>DBMS</strong>, <strong>System Design</strong>, or <strong>Web Development</strong>:
          </p>

          {/* Stepper Timeline */}
          <div className="space-y-3.5 pl-2 border-l-2 border-primary/30">
            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-pixel-sm" />
              <h4 className="font-bold text-xs text-ink">Step 1: Make sure the desktop app is running.</h4>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-pixel-sm" />
              <h4 className="font-bold text-xs text-ink">Step 2: Unzip the starter kit.</h4>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-pixel-sm" />
              <h4 className="font-bold text-xs text-ink">Step 3: Open its folder in VS Code.</h4>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-pixel-sm" />
              <h4 className="font-bold text-xs text-ink">Step 4: Ensure the VS Code extension is installed & active.</h4>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-pixel-sm" />
              <h4 className="font-bold text-xs text-ink">Step 5: Open a file inside the kit's src/ folder.</h4>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-learning border-2 border-white shadow-pixel-sm" />
              <h4 className="font-bold text-xs text-ink">Step 6: Start working through the TODOs in the README.</h4>
            </div>
          </div>

          <Callout type="tip" title="Adaptive Alignment">
            The companion can pick up on the kinds of mistakes each exercise is designed to surface and ask questions as you work.
          </Callout>
        </section>

        {/* SECTION: HEALTH CHECK */}
        <section id="health-check" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">Checking It’s Actually Running</h2>
            <p className="text-xs text-ink-secondary mt-1">Verifying your local port connectivity.</p>
          </div>

          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            The desktop application exposes an internal health endpoint on loopback:
          </p>

          <CodeBlock
            language="BASH"
            code="curl http://127.0.0.1:4123/health"
          />

          <Callout type="success" title="Expected Response">
            <code>{"{\"status\":\"ok\"}"}</code>
          </Callout>

          <p className="text-xs text-ink-secondary">
            If this request fails, the desktop application may not be running. Restart it with <code>npm start</code>. This endpoint is strictly bound to localhost and is never remotely accessible.
          </p>
        </section>

        {/* SECTION: PRIVACY */}
        <section id="privacy" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-xl font-bold text-ink">Privacy — What It Actually Sees</h2>
              <p className="text-xs text-ink-secondary mt-1">Clear transparency on file and telemetry access.</p>
            </div>
            <Lock className="w-5 h-5 text-learning" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm space-y-2 text-xs sm:text-sm text-ink-secondary">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The desktop app itself only displays what it is told to show.</li>
              <li>It does not independently read your screen.</li>
              <li>It does not independently read your files.</li>
              <li>Code observation happens solely in the separate VS Code extension.</li>
              <li>The extension only looks at the file you are actively editing.</li>
              <li>Communication between the desktop app and extension happens through <strong>127.0.0.1</strong>.</li>
              <li>Code does not leave your computer unless the extension has been configured to call an external diagnosis backend.</li>
              <li>That external diagnosis behavior can be disabled completely.</li>
            </ul>
          </div>

          {/* Privacy Flow Diagram */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-primary/30 text-xs space-y-2">
            <span className="font-pixel font-bold text-primary uppercase">Local Data Boundary:</span>
            <div className="font-mono text-[11px] text-ink bg-white p-3 rounded-lg border border-slate-200">
              ACTIVE FILE ──▶ VS CODE EXTENSION ──▶ 127.0.0.1 ──▶ DESKTOP PET
            </div>
          </div>
        </section>

        {/* SECTION: TROUBLESHOOTING */}
        <section id="troubleshooting" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-5">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">Troubleshooting</h2>
            <p className="text-xs text-ink-secondary mt-1">Answers to common companion questions.</p>
          </div>

          <div className="space-y-3">
            {/* FAQ 1 */}
            <div className="rounded-xl border-2 border-slate-900 overflow-hidden bg-slate-50">
              <button
                onClick={() => toggleFaq('never-appears')}
                className="w-full text-left p-4 font-bold text-xs sm:text-sm text-ink flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <span>The window never appears</span>
                {openFaq['never-appears'] ? (
                  <ChevronDown className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openFaq['never-appears'] && (
                <div className="p-4 pt-0 text-xs text-ink-secondary border-t border-slate-200 bg-white space-y-2">
                  <p>Check the terminal for errors after <code>npm start</code>.</p>
                  <p>Common causes include:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code>npm install</code> did not finish cleanly.</li>
                    <li>Node.js is not installed. Check with <code>node -v</code>.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="rounded-xl border-2 border-slate-900 overflow-hidden bg-slate-50">
              <button
                onClick={() => toggleFaq('never-reacts')}
                className="w-full text-left p-4 font-bold text-xs sm:text-sm text-ink flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <span>It's running but never reacts</span>
                {openFaq['never-reacts'] ? (
                  <ChevronDown className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openFaq['never-reacts'] && (
                <div className="p-4 pt-0 text-xs text-ink-secondary border-t border-slate-200 bg-white space-y-2">
                  <p>Make sure:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The VS Code extension is installed and active in your editor.</li>
                    <li>You are actively editing a supported file.</li>
                    <li>The extension has enough time to evaluate the code.</li>
                  </ul>
                  <Callout type="warning" title="Pacing">
                    The companion is not designed to react on every keystroke by design. It checks after a natural pause in typing.
                  </Callout>
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="rounded-xl border-2 border-slate-900 overflow-hidden bg-slate-50">
              <button
                onClick={() => toggleFaq('quit')}
                className="w-full text-left p-4 font-bold text-xs sm:text-sm text-ink flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <span>I want to quit it</span>
                {openFaq['quit'] ? (
                  <ChevronDown className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openFaq['quit'] && (
                <div className="p-4 pt-0 text-xs text-ink-secondary border-t border-slate-200 bg-white">
                  <p>
                    Close the pet window directly, or press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-xs">Ctrl+C</kbd> in the terminal where the app was launched.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
