import { useState, useEffect, useRef } from "react";

/* ───────────────── Typed Text Hook ───────────────── */
function useTypedText(texts: string[], speed = 100, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % texts.length);
    }

    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

/* ───────────────── Intersection Observer Hook ───────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ───────────────── Particle Background ───────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; o: number };
    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      o: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`;
        ctx.fill();
      }
      // draw lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}

/* ───────────────── Section Wrapper ───────────────── */
function Section({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${
        inView ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${className}`}
    >
      {children}
    </section>
  );
}

/* ───────────────── Skill Bar ───────────────── */
function SkillBar({ name, pct, color }: { name: string; pct: number; color: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className="mb-4">
      <div className="mb-1 flex justify-between text-sm font-medium text-slate-300">
        <span>{name}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: inView ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

/* ───────────────── Timeline Item ───────────────── */
function TimelineItem({
  year,
  title,
  desc,
  icon,
}: {
  year: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`relative pl-10 pb-10 transition-all duration-700 ${
        inView ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
      }`}
    >
      {/* line */}
      <div className="absolute left-3.5 top-0 h-full w-px bg-gradient-to-b from-violet-500 to-transparent" />
      {/* dot */}
      <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30">
        {icon}
      </div>
      <span className="mb-1 inline-block rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-semibold text-violet-300">
        {year}
      </span>
      <h4 className="mt-1 text-lg font-bold text-white">{title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">{desc}</p>
    </div>
  );
}

/* ───────────────── Main App ───────────────── */
export default function App() {
  const typed = useTypedText(
    ["Gamer 🎮", "Coder 💻", "Tech Explorer 🚀", "Curious Mind 🔍"],
    90,
    1800
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#hobbies", label: "Hobbies" },
    { href: "#skills", label: "Skills" },
    { href: "#journey", label: "Journey" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white font-sans">
      <ParticleCanvas />

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/80 shadow-lg shadow-black/20 backdrop-blur-lg"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="#home"
            className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent"
          >
            {"<Devon />"}
          </a>

          {/* Desktop */}
          <ul className="hidden gap-8 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm font-medium text-slate-300 transition hover:text-violet-400"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile toggle */}
          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`h-0.5 w-6 bg-white transition-transform ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-white transition-opacity ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-white transition-transform ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <ul className="flex flex-col items-center gap-4 bg-slate-900/95 py-6 backdrop-blur-lg md:hidden">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-medium text-slate-200 transition hover:text-violet-400"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <Section
        id="home"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="h-72 w-72 rounded-full bg-violet-600/20 blur-[120px]" />
        </div>

        {/* Avatar */}
        <div className="relative mb-8">
          <div className="h-36 w-36 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[3px] shadow-xl shadow-violet-500/30">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-5xl font-black text-violet-300">
              D
            </div>
          </div>
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-4 ring-slate-950">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          </span>
        </div>

        <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Devon Sharon Imanuel
          </span>
        </h1>

        <p className="mb-2 text-lg text-slate-400 sm:text-xl">
          I'm a{" "}
          <span className="font-semibold text-violet-400">
            {typed}
            <span className="animate-pulse">|</span>
          </span>
        </p>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Passionate about technology, gaming, and writing code that makes a difference. Always
          curious, always learning.
        </p>

        <div className="mt-8 flex gap-4">
          <a
            href="#about"
            className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 transition hover:scale-105 hover:shadow-violet-500/50"
          >
            Tentang Saya
          </a>
          <a
            href="#contact"
            className="rounded-full border border-slate-700 px-7 py-3 text-sm font-semibold text-slate-300 transition hover:border-violet-500 hover:text-violet-400"
          >
            Kontak
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-slate-600">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="h-8 w-5 rounded-full border-2 border-slate-700 p-1">
            <div className="mx-auto h-2 w-1 animate-bounce rounded-full bg-violet-500" />
          </div>
        </div>
      </Section>

      {/* ─── ABOUT ─── */}
      <Section id="about" className="relative z-10 py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
            Tentang Saya
          </h2>
          <h3 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">
            Siapa{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Devon?
            </span>
          </h3>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
              <p className="mb-4 leading-relaxed text-slate-300">
                Halo! Nama saya{" "}
                <span className="font-bold text-white">Devon Sharon Imanuel</span>. Saya
                adalah seseorang yang memiliki ketertarikan besar terhadap dunia{" "}
                <span className="text-violet-400 font-semibold">teknologi</span>,{" "}
                <span className="text-fuchsia-400 font-semibold">gaming</span>, dan{" "}
                <span className="text-cyan-400 font-semibold">coding</span>.
              </p>
              <p className="mb-4 leading-relaxed text-slate-300">
                Rasa keingintahuan saya tentang bagaimana teknologi bekerja mendorong saya untuk
                terus belajar dan bereksperimen. Dari membongkar cara kerja software, mempelajari
                bahasa pemrograman baru, hingga mengeksplorasi perkembangan AI — semuanya membuat
                saya semakin semangat.
              </p>
              <p className="leading-relaxed text-slate-300">
                Saya percaya bahwa kombinasi antara kreativitas dan teknologi dapat menciptakan
                sesuatu yang luar biasa. Itulah mengapa saya selalu berusaha untuk mengembangkan
                diri dan memperluas pengetahuan saya setiap hari.
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🎮", label: "Hobi Utama", value: "Gaming" },
                { icon: "💻", label: "Passion", value: "Coding" },
                { icon: "🔬", label: "Minat", value: "Teknologi" },
                { icon: "📚", label: "Prinsip", value: "Never Stop Learning" },
                { icon: "🌐", label: "Fokus", value: "Web Dev" },
                { icon: "🧠", label: "Sifat", value: "Curious Mind" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="group flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-center backdrop-blur transition hover:border-violet-500/50 hover:bg-violet-500/5"
                >
                  <span className="mb-2 text-3xl transition-transform group-hover:scale-110">
                    {c.icon}
                  </span>
                  <span className="text-xs text-slate-500">{c.label}</span>
                  <span className="font-bold text-white">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── HOBBIES ─── */}
      <Section id="hobbies" className="relative z-10 py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
            Hobi & Minat
          </h2>
          <h3 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">
            Yang Saya{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Sukai
            </span>
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Gaming Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-600/10 blur-2xl transition-all group-hover:bg-violet-600/20" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10 text-3xl">
                  🎮
                </div>
                <h4 className="mb-2 text-xl font-bold">Gaming</h4>
                <p className="text-sm leading-relaxed text-slate-400">
                  Gaming bukan hanya hiburan bagi saya, tapi juga cara untuk melatih strategic
                  thinking, problem solving, dan kerja sama tim. Dari game RPG hingga FPS, setiap
                  genre punya pelajaran tersendiri.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["RPG", "FPS", "Strategy", "Open World"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Coding Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur transition-all hover:border-fuchsia-500/50 hover:shadow-lg hover:shadow-fuchsia-500/10">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-600/10 blur-2xl transition-all group-hover:bg-fuchsia-600/20" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-fuchsia-500/10 text-3xl">
                  💻
                </div>
                <h4 className="mb-2 text-xl font-bold">Coding</h4>
                <p className="text-sm leading-relaxed text-slate-400">
                  Menulis kode adalah cara saya menuangkan ide menjadi kenyataan. Mulai dari
                  membuat website, aplikasi, hingga automation script — coding membuat saya merasa
                  bisa menciptakan apapun.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["JavaScript", "Python", "React", "Web Dev"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Exploration Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 sm:col-span-2 lg:col-span-1">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-600/10 blur-2xl transition-all group-hover:bg-cyan-600/20" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 text-3xl">
                  🔬
                </div>
                <h4 className="mb-2 text-xl font-bold">Eksplorasi Teknologi</h4>
                <p className="text-sm leading-relaxed text-slate-400">
                  Keingintahuan saya tentang teknologi tidak pernah berhenti. Dari AI, blockchain,
                  IoT, hingga cybersecurity — saya selalu excited untuk mempelajari tren dan
                  inovasi terbaru di dunia tech.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["AI", "IoT", "Cyber Security", "Blockchain"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── SKILLS ─── */}
      <Section id="skills" className="relative z-10 py-28 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
            Kemampuan
          </h2>
          <h3 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">
            Tech{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Skills
            </span>
          </h3>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
              <h4 className="mb-6 flex items-center gap-2 text-lg font-bold">
                <span className="text-violet-400">⚡</span> Programming
              </h4>
              <SkillBar name="JavaScript / TypeScript" pct={85} color="bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <SkillBar name="Python" pct={70} color="bg-gradient-to-r from-blue-500 to-cyan-500" />
              <SkillBar name="HTML & CSS" pct={90} color="bg-gradient-to-r from-orange-500 to-pink-500" />
              <SkillBar name="React" pct={75} color="bg-gradient-to-r from-cyan-500 to-blue-500" />
              <SkillBar name="Node.js" pct={65} color="bg-gradient-to-r from-green-500 to-emerald-500" />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
              <h4 className="mb-6 flex items-center gap-2 text-lg font-bold">
                <span className="text-fuchsia-400">🛠️</span> Tools & Others
              </h4>
              <SkillBar name="Git & GitHub" pct={80} color="bg-gradient-to-r from-fuchsia-500 to-violet-500" />
              <SkillBar name="VS Code" pct={95} color="bg-gradient-to-r from-blue-500 to-violet-500" />
              <SkillBar name="Problem Solving" pct={85} color="bg-gradient-to-r from-amber-500 to-orange-500" />
              <SkillBar name="Gaming Strategy" pct={90} color="bg-gradient-to-r from-red-500 to-pink-500" />
              <SkillBar name="Networking Basics" pct={60} color="bg-gradient-to-r from-teal-500 to-cyan-500" />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── JOURNEY / TIMELINE ─── */}
      <Section id="journey" className="relative z-10 py-28 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
            Perjalanan
          </h2>
          <h3 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">
            My{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Journey
            </span>
          </h3>

          <div className="ml-2">
            <TimelineItem
              year="Awal Mula"
              title="Pertama Kali Kenal Komputer"
              desc="Rasa penasaran pertama muncul saat menyentuh komputer. Dari sekadar bermain game, muncul pertanyaan — bagaimana semua ini bisa bekerja?"
              icon={<span className="text-xs">💡</span>}
            />
            <TimelineItem
              year="Dunia Gaming"
              title="Masuk ke Dunia Gaming"
              desc="Mulai mengenal berbagai genre game dan komunitas gaming. Belajar strategi, teamwork, dan kompetisi yang sehat melalui gaming online."
              icon={<span className="text-xs">🎮</span>}
            />
            <TimelineItem
              year="Belajar Coding"
              title="Menulis Baris Kode Pertama"
              desc="Hello World! Dari satu baris kode sederhana, terbuka dunia yang luas. Mulai belajar HTML, CSS, lalu JavaScript dan seterusnya."
              icon={<span className="text-xs">💻</span>}
            />
            <TimelineItem
              year="Eksplorasi"
              title="Mendalami Teknologi"
              desc="Memperluas pengetahuan ke berbagai bidang teknologi — AI, cybersecurity, IoT, dan cloud computing. Rasa ingin tahu tak pernah berhenti."
              icon={<span className="text-xs">🔬</span>}
            />
            <TimelineItem
              year="Sekarang"
              title="Terus Berkembang"
              desc="Terus belajar, membangun project, dan mengeksplorasi hal baru. Perjalanan ini baru dimulai dan masih banyak yang ingin dicapai!"
              icon={<span className="text-xs">🚀</span>}
            />
          </div>
        </div>
      </Section>

      {/* ─── QUOTES ─── */}
      <Section className="relative z-10 py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-12 backdrop-blur">
            <svg
              className="mx-auto mb-4 h-10 w-10 text-violet-500/50"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.3 2.5C6.5 4.1 3 8.5 3 13.5c0 3.6 2.4 6 5.5 6 2.8 0 4.5-2 4.5-4.3 0-2.2-1.6-3.9-3.7-3.9-.8 0-1.5.2-2 .6.3-2.8 2.7-6 5.7-7.4L11.3 2.5zm10 0c-4.8 1.6-8.3 6-8.3 11 0 3.6 2.4 6 5.5 6 2.8 0 4.5-2 4.5-4.3 0-2.2-1.6-3.9-3.7-3.9-.8 0-1.5.2-2 .6.3-2.8 2.7-6 5.7-7.4L21.3 2.5z" />
            </svg>
            <p className="mb-4 text-xl font-medium italic leading-relaxed text-slate-200 sm:text-2xl">
              "Stay curious, keep learning, and never stop exploring the possibilities that
              technology offers."
            </p>
            <p className="text-sm font-semibold text-violet-400">— Devon Sharon Imanuel</p>
          </div>
        </div>
      </Section>

      {/* ─── CONTACT ─── */}
      <Section id="contact" className="relative z-10 py-28 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
            Hubungi Saya
          </h2>
          <h3 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">
            Let's{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Connect
            </span>
          </h3>

           <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                ),
                label: "Email",
                value: "nataliariyadi37@gmail.com",
                href: "mailto:nataliariyadi37@gmail.com",
                color: "text-violet-400",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                ),
                label: "GitHub",
                value: "Devstilllearning",
                href: "https://github.com/Devstilllearning",
                color: "text-fuchsia-400",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                ),
                label: "WhatsApp",
                value: "085133383976",
                href: "https://wa.me/6285133383976",
                color: "text-cyan-400",
              },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className={`mb-4 ${c.color} transition-transform group-hover:scale-110`}>
                  {c.icon}
                </div>
                <span className="mb-1 text-sm text-slate-500">{c.label}</span>
                <span className="font-semibold text-white">{c.value}</span>
              </a>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-slate-800 py-8 text-center">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()}{" "}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text font-semibold text-transparent">
            Devon Sharon Imanuel
          </span>
          . Made with 💜 & curiosity.
        </p>
      </footer>
    </div>
  );
}
