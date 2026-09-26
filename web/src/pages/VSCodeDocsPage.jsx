import React, { useState, useEffect, useRef } from 'react';
import PenguMascot from '../components/common/PenguMascot';
import PixelBadge from '../components/common/PixelBadge';
import {
  BookOpen,
  Terminal,
  Check,
  Copy,
  ChevronRight,
  Download,
  Upload,
  FileArchive,
  Sparkles,
  Laptop,
  Puzzle,
  Code2,
  Database,
  Layers,
  Globe,
  CheckCircle2,
} from 'lucide-react';

// Documentation Section Navigation Items
const DOC_SECTIONS = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'setup', title: 'Setup (1-3)' },
  { id: 'starter-kits', title: 'Starter Kits' },
  { id: 'zip-downloads', title: 'Downloads & Uploads' },
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
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-pixel font-bold uppercase tracking-wider text-slate-300">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-sans text-xs cursor-pointer"
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
      <pre className="p-4 overflow-x-auto leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// 5 Backend ZIP Packages Definition
const INITIAL_PACKAGES = [
  {
    id: 'pkg-desktop',
    filename: 'desktop-companion.zip',
    title: 'Desktop Companion App',
    description: 'Electron-based floating companion that monitors local port 4123 and reacts as you code.',
    size: '14.2 MB',
    type: 'Application',
    badgeVariant: 'blue',
  },
  {
    id: 'pkg-dsa',
    filename: 'dsa-binary-search-recursion.zip',
    title: 'DSA — Binary Search & Recursion',
    description: 'Starter kit testing loop bounds, empty input edge cases, and recursive base cases.',
    size: '2.8 MB',
    type: 'Starter Kit',
    badgeVariant: 'green',
  },
  {
    id: 'pkg-dbms',
    filename: 'dbms-query-engine.zip',
    title: 'DBMS — Query Engine',
    description: 'Starter kit exploring how WHERE/JOIN execute, ID comparison pitfalls, and empty tables.',
    size: '3.4 MB',
    type: 'Starter Kit',
    badgeVariant: 'yellow',
  },
  {
    id: 'pkg-sysdesign',
    filename: 'system-design-lru-cache.zip',
    title: 'System Design — LRU Cache',
    description: 'Starter kit for cache eviction logic, capacity limits, and infinite eviction prevention.',
    size: '3.1 MB',
    type: 'Starter Kit',
    badgeVariant: 'red',
  },
  {
    id: 'pkg-webdev',
    filename: 'web-dev-fetch-debounce.zip',
    title: 'Web Dev — Fetch & Debounce',
    description: 'Starter kit for retry logic without infinite loops, async errors, and event debouncing.',
    size: '2.6 MB',
    type: 'Starter Kit',
    badgeVariant: 'yellow',
  },
];

export default function VSCodeDocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [packages, setPackages] = useState(INITIAL_PACKAGES);
  const [uploadStatus, setUploadStatus] = useState({});
  const fileInputRefs = useRef({});

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  // Function to download a ZIP placeholder file
  const handleDownloadZip = (pkg) => {
    // Generate a downloadable placeholder zip blob
    const content = `Package: ${pkg.title}\nFilename: ${pkg.filename}\nDownloaded from: PenguLearn Study Companion\nDescription: ${pkg.description}\n\nGetting Started:\n1. Unzip this package\n2. Open in VS Code\n3. Start solving the TODOs in src/\n`;
    const blob = new Blob([content], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pkg.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to handle backend zip upload placeholder
  const handleFileUpload = (pkgId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus((prev) => ({
      ...prev,
      [pkgId]: `Uploading ${file.name}...`,
    }));

    setTimeout(() => {
      setUploadStatus((prev) => ({
        ...prev,
        [pkgId]: `✓ ${file.name} uploaded to backend (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      }));
      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkgId
            ? { ...p, filename: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` }
            : p
        )
      );
    }, 1200);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in pb-12">
      {/* ============================================================== */}
      {/* 1. DOCS NAVIGATION SIDEBAR                                     */}
      {/* ============================================================== */}
      <aside className="w-full lg:w-60 flex-shrink-0 lg:sticky lg:top-4 z-20">
        <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-4">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b-2 border-slate-200">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-pixel text-xs font-bold text-ink uppercase tracking-wider">
              Doc Sections
            </h3>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
            {DOC_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`px-3 py-2 rounded-xl text-left text-xs font-medium whitespace-nowrap transition-all flex items-center justify-between cursor-pointer ${
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
      <div className="flex-1 min-w-0 max-w-3xl space-y-10">
        {/* HERO SECTION */}
        <section id="getting-started" className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pixel-grid-dots opacity-40 pointer-events-none" />

          <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/30 text-xs font-pixel font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5 text-warning" />
                <span>Developer Companion v1.0</span>
              </div>

              <h1 className="font-pixel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
                Getting Started with the Study Companion
              </h1>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-sans max-w-xl">
                A small floating companion appears on your screen while you code. It watches for mistakes and guides you with questions rather than handing you the answers.
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

        {/* SETUP SECTION */}
        <section id="setup" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-xl font-bold text-ink">Setup</h2>
              <p className="text-xs text-ink-secondary mt-1">Get your desktop companion and VS Code extension running in 3 steps.</p>
            </div>
            <Terminal className="w-5 h-5 text-primary" />
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary text-white font-pixel font-bold flex items-center justify-center text-sm shadow-pixel-sm">
                  1
                </span>
                <h3 className="font-bold text-base text-ink">
                  Install the Desktop Companion (once)
                </h3>
              </div>

              <CodeBlock
                language="BASH"
                code={`unzip desktop-companion.zip && cd desktop-companion\nnpm install && npm start`}
              />

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed pl-1">
                A small floating companion appears on your screen. Leave it running while you code.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary text-white font-pixel font-bold flex items-center justify-center text-sm shadow-pixel-sm">
                  2
                </span>
                <h3 className="font-bold text-base text-ink">
                  Install the VS Code Extension (once)
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm space-y-2">
                <p className="text-xs sm:text-sm text-ink leading-relaxed font-sans">
                  Install <strong>Socratic Study Companion</strong> from the VS Code Marketplace (or load the provided <code>.vsix</code>). This is what actually reads your code and talks to the companion.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary text-white font-pixel font-bold flex items-center justify-center text-sm shadow-pixel-sm">
                  3
                </span>
                <h3 className="font-bold text-base text-ink">
                  Download a starter kit, open it in VS Code
                </h3>
              </div>

              <CodeBlock
                language="BASH"
                code={`unzip <kit-name>.zip && cd <kit-name>\ncode .`}
              />

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed pl-1">
                Open any file in <code>src/</code>, start coding the TODOs. The companion will ask you a question if it spots a mistake — it won't hand you the fix.
              </p>
            </div>
          </div>
        </section>

        {/* STARTER KITS SECTION */}
        <section id="starter-kits" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-200 pb-3">
            <h2 className="font-pixel text-xl font-bold text-ink">Starter Kits</h2>
            <p className="text-xs text-ink-secondary mt-1">Curated hands-on coding repositories with built-in Socratic checkpoints.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-xs font-pixel font-bold text-ink uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-4">Kit</th>
                  <th className="py-3 px-4">You'll practice</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-slate-200 text-xs sm:text-sm">
                {/* Kit 1 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-ink">
                    DSA — Binary Search &amp; Recursion
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary text-xs">
                    Loop bounds, edge cases on empty input, recursive base cases
                  </td>
                  <td className="py-3.5 px-4">
                    <PixelBadge variant="green" size="sm">
                      Beginner
                    </PixelBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadZip(packages[1])}
                      className="pixel-btn-secondary !text-xs !py-1 !px-2.5 inline-flex items-center gap-1 cursor-pointer"
                      title="Download starter kit zip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.zip</span>
                    </button>
                  </td>
                </tr>

                {/* Kit 2 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-ink">
                    DBMS — Query Engine
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary text-xs">
                    How WHERE/JOIN work under the hood, ID comparison pitfalls, handling empty tables
                  </td>
                  <td className="py-3.5 px-4">
                    <PixelBadge variant="yellow" size="sm">
                      Intermediate
                    </PixelBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadZip(packages[2])}
                      className="pixel-btn-secondary !text-xs !py-1 !px-2.5 inline-flex items-center gap-1 cursor-pointer"
                      title="Download starter kit zip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.zip</span>
                    </button>
                  </td>
                </tr>

                {/* Kit 3 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-ink">
                    System Design — LRU Cache
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary text-xs">
                    Cache eviction logic, capacity edge cases, avoiding infinite loops in eviction
                  </td>
                  <td className="py-3.5 px-4">
                    <PixelBadge variant="red" size="sm">
                      Intermediate–Advanced
                    </PixelBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadZip(packages[3])}
                      className="pixel-btn-secondary !text-xs !py-1 !px-2.5 inline-flex items-center gap-1 cursor-pointer"
                      title="Download starter kit zip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.zip</span>
                    </button>
                  </td>
                </tr>

                {/* Kit 4 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-ink">
                    Web Dev — Fetch &amp; Debounce
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary text-xs">
                    Retry logic without infinite loops, async error handling, debouncing rapid events
                  </td>
                  <td className="py-3.5 px-4">
                    <PixelBadge variant="yellow" size="sm">
                      Intermediate
                    </PixelBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadZip(packages[4])}
                      className="pixel-btn-secondary !text-xs !py-1 !px-2.5 inline-flex items-center gap-1 cursor-pointer"
                      title="Download starter kit zip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.zip</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5 ZIP FILE PLACEHOLDERS (DOWNLOAD & UPLOAD TO BACKEND) */}
        <section id="zip-downloads" className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-pixel text-xl font-bold text-ink">
                Package Downloads &amp; Backend Upload Placeholders
              </h2>
              <p className="text-xs text-ink-secondary mt-1">
                5 dedicated placeholders for study companion zip packages. Users can download anytime or upload new packages to the backend.
              </p>
            </div>
            <FileArchive className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className="p-4 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft border border-slate-900 flex items-center justify-center text-primary flex-shrink-0 font-pixel font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-ink">{pkg.title}</h4>
                      <PixelBadge variant={pkg.badgeVariant} size="sm">
                        {pkg.type}
                      </PixelBadge>
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {pkg.filename} ({pkg.size})
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 leading-snug">
                      {pkg.description}
                    </p>
                    {uploadStatus[pkg.id] && (
                      <p className="text-[11px] font-pixel text-learning-hover mt-1 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-learning" />
                        {uploadStatus[pkg.id]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Download button and Backend Upload Placeholder */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {/* Hidden file input for uploading to backend */}
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    ref={(el) => (fileInputRefs.current[pkg.id] = el)}
                    onChange={(e) => handleFileUpload(pkg.id, e)}
                    className="hidden"
                  />

                  {/* Backend Upload Placeholder Button */}
                  <button
                    onClick={() => fileInputRefs.current[pkg.id]?.click()}
                    className="pixel-btn-secondary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-ink"
                    title="Upload replacement ZIP to backend"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload ZIP</span>
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownloadZip(pkg)}
                    className="pixel-btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5 cursor-pointer"
                    title="Download ZIP package"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
