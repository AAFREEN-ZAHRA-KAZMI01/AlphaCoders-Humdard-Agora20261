import { Link } from 'react-router-dom'

// ─── Reusable tiny components ────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div>
          <span className="text-2xl font-extrabold text-teal-600 tracking-tight">HumDard</span>
          <span className="ml-2 text-xs text-gray-400 font-medium">ہم درد</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="px-5 py-2 text-sm font-semibold text-teal-700 border-2 border-teal-300 rounded-xl hover:bg-teal-50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup/citizen"
            className="px-5 py-2 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-colors shadow-md shadow-teal-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Phone mockup SVG ────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative w-64 mx-auto">
      {/* glow */}
      <div className="absolute inset-0 bg-teal-400/20 rounded-[3rem] blur-3xl scale-110" />
      {/* phone frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl ring-1 ring-white/10">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* status bar */}
          <div className="bg-teal-500 px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-extrabold text-sm">HumDard</span>
              <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </div>
          {/* feed preview */}
          <div className="p-3 space-y-2.5 bg-gray-50">
            {/* post card 1 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">A</div>
                <div>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
                  <div className="w-10 h-1 bg-gray-100 rounded-full mt-0.5" />
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden mb-2">
                <div className="w-full h-20 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl">🏗️</div>
                <span className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✅ Verified</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full" />
              <div className="w-3/4 h-1.5 bg-gray-100 rounded-full mt-1" />
              <div className="flex gap-3 mt-2">
                <span className="text-xs text-gray-400">❤️ 12</span>
                <span className="text-xs text-gray-400">💬 4</span>
              </div>
            </div>
            {/* post card 2 */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">N</div>
                <div>
                  <div className="w-14 h-1.5 bg-gray-200 rounded-full" />
                  <div className="w-8 h-1 bg-gray-100 rounded-full mt-0.5" />
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden mb-2">
                <div className="w-full h-16 bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center text-2xl">🌊</div>
                <span className="absolute top-1.5 right-1.5 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">🔍 Analyzing</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full" />
            </div>
          </div>
        </div>
        {/* home bar */}
        <div className="flex justify-center mt-1.5 pb-1">
          <div className="w-16 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── CR Badge visual ─────────────────────────────────────────────────────────
function CRBadgeDemo({ fake }) {
  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all ${
      fake
        ? 'bg-amber-50 border-amber-200'
        : 'bg-green-50 border-green-200'
    }`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm ${
        fake ? 'bg-amber-100' : 'bg-green-100'
      }`}>
        {fake ? '⚠️' : '✅'}
      </div>
      <div className="text-center">
        <p className={`text-sm font-bold ${fake ? 'text-amber-700' : 'text-green-700'}`}>
          {fake ? 'Possibly Fake' : 'Verified Real'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Confidence: {fake ? '87%' : '94%'}</p>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
        fake ? 'bg-amber-400 text-amber-900' : 'bg-green-500 text-white'
      }`}>
        CR Badge
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${fake ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: fake ? '87%' : '94%' }}
        />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-gray-900 overflow-x-hidden">
      <NavBar />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Pakistan's Community Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Pakistan Ki Awaaz,{' '}
              <span className="text-teal-500 relative">
                Ek Jagah
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q50 0 100 6 Q150 12 200 6" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              A platform connecting citizens, NGOs, and volunteers to solve real problems together — with AI-powered truth verification built in.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/signup/citizen"
                className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-teal-200 hover:shadow-teal-300 hover:-translate-y-0.5"
              >
                Get Started — It's Free
              </Link>
              <Link
                to="/signin"
                className="px-8 py-4 border-2 border-teal-300 hover:border-teal-500 text-teal-700 text-lg font-bold rounded-2xl transition-all hover:bg-teal-50"
              >
                Sign In
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start text-sm text-gray-400">
              <span className="flex items-center gap-1.5">✓ <span>Free to join</span></span>
              <span className="flex items-center gap-1.5">✓ <span>No ads</span></span>
              <span className="flex items-center gap-1.5">✓ <span>AI-verified content</span></span>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="flex-shrink-0 w-72 hidden lg:block">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-teal-500 font-bold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Three steps to real change</h2>
            <p className="text-gray-400 mt-3 text-lg">From problem to solution — faster than ever.</p>
          </div>

          <div className="relative">
            {/* connector line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />

            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  step: '01',
                  icon: '📸',
                  title: 'Report',
                  color: 'bg-teal-50 border-teal-200',
                  iconBg: 'bg-teal-100',
                  accent: 'text-teal-600',
                  lines: [
                    'Citizens post real problems — broken roads, floods, missing resources.',
                    'Attach a photo, video, and your exact GPS location in seconds.',
                  ],
                },
                {
                  step: '02',
                  icon: '🤖',
                  title: 'Verify',
                  color: 'bg-purple-50 border-purple-200',
                  iconBg: 'bg-purple-100',
                  accent: 'text-purple-600',
                  lines: [
                    'Our AI analyzes every uploaded image for authenticity automatically.',
                    'A Credibility Rating (CR) badge is attached to every media file.',
                  ],
                },
                {
                  step: '03',
                  icon: '🤝',
                  title: 'Respond',
                  color: 'bg-orange-50 border-orange-200',
                  iconBg: 'bg-orange-100',
                  accent: 'text-orange-600',
                  lines: [
                    'NGOs and volunteers see verified reports and coordinate action.',
                    'Track progress, post updates, and close the loop as a community.',
                  ],
                },
              ].map(({ step, icon, title, color, iconBg, accent, lines }) => (
                <div key={step} className={`relative flex flex-col items-center text-center p-8 rounded-3xl border-2 ${color} shadow-sm`}>
                  <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm`}>
                    {icon}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${accent} mb-1`}>Step {step}</span>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{title}</h3>
                  {lines.map((l, i) => (
                    <p key={i} className="text-gray-500 text-sm leading-relaxed">{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — WHO IS IT FOR
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-[#FAFAF7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-teal-500 font-bold text-sm uppercase tracking-widest">For Everyone</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Who is HumDard for?</h2>
            <p className="text-gray-400 mt-3 text-lg">Three kinds of people, one shared mission.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '👤',
                type: 'citizen',
                title: 'Citizens',
                badge: 'bg-blue-100 text-blue-700',
                border: 'border-blue-100 hover:border-blue-300',
                btnCls: 'bg-blue-500 hover:bg-blue-600 text-white',
                desc: 'Post issues in your community with photos, videos, and your exact location.',
                detail: 'Your voice matters — every verified report goes directly to those who can help.',
                link: '/signup/citizen',
              },
              {
                icon: '🏢',
                type: 'ngo',
                title: 'NGOs & Organizations',
                badge: 'bg-purple-100 text-purple-700',
                border: 'border-purple-100 hover:border-purple-300',
                btnCls: 'bg-purple-500 hover:bg-purple-600 text-white',
                desc: 'Discover real, verified problems near you. Coordinate resources efficiently.',
                detail: 'Show your impact to the community with transparent, traceable actions.',
                link: '/signup/ngo',
              },
              {
                icon: '🙋',
                type: 'volunteer',
                title: 'Volunteers',
                badge: 'bg-orange-100 text-orange-700',
                border: 'border-orange-100 hover:border-orange-300',
                btnCls: 'bg-orange-500 hover:bg-orange-600 text-white',
                desc: 'Find opportunities to help based on your skills and location.',
                detail: 'Connect with NGOs, respond to emergencies, and make a difference in your city.',
                link: '/signup/volunteer',
              },
            ].map(({ icon, type, title, badge, border, btnCls, desc, detail, link }) => (
              <div
                key={type}
                className={`bg-white rounded-3xl border-2 ${border} p-8 flex flex-col shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="text-5xl mb-4">{icon}</div>
                <span className={`inline-block self-start px-3 py-0.5 rounded-full text-xs font-bold mb-3 ${badge}`}>
                  {title}
                </span>
                <p className="text-gray-800 font-semibold text-base mb-2 leading-snug">{desc}</p>
                <p className="text-gray-400 text-sm leading-relaxed flex-1">{detail}</p>
                <Link
                  to={link}
                  className={`mt-6 py-3 rounded-xl text-sm font-bold text-center transition-colors ${btnCls} shadow-sm`}
                >
                  Join as {title.split(' ')[0]}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — TRUST & TRANSPARENCY
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* top badge */}
          <div className="text-center mb-14">
            <span className="text-teal-500 font-bold text-sm uppercase tracking-widest">AI Credibility Engine</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Every Post. Verified.</h2>
            <p className="text-xl text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Our AI automatically analyzes every uploaded image and flags potentially fake content — so the community always sees the truth.
            </p>
          </div>

          {/* CR badge demo */}
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-2xl mx-auto mb-16">
            <div className="flex-1 w-full">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">Flagged as suspicious</p>
              <CRBadgeDemo fake />
            </div>

            <div className="hidden md:flex flex-col items-center gap-2 text-gray-300">
              <div className="w-px h-10 bg-gray-200" />
              <span className="text-sm font-bold text-gray-400">vs</span>
              <div className="w-px h-10 bg-gray-200" />
            </div>
            <div className="md:hidden text-gray-300 font-bold text-lg">vs</div>

            <div className="flex-1 w-full">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">Verified authentic</p>
              <CRBadgeDemo fake={false} />
            </div>
          </div>

          {/* How it works mini explainer */}
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 mb-14 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">How the CR Badge works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[
                { icon: '📤', label: 'Upload',   desc: 'User uploads a photo or video with their post' },
                { icon: '🧠', label: 'AI Scan',  desc: 'Our ML model checks for manipulation or AI generation' },
                { icon: '🏷️', label: 'Badge',    desc: 'A CR badge appears on the post — green, amber, or pending' },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl">{icon}</div>
                  <p className="font-semibold text-sm text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-14">
            {[
              { value: '3',        label: 'User Types',    sub: 'Citizen · NGO · Volunteer' },
              { value: 'AI',       label: 'Powered',       sub: 'EfficientNet-B4 model' },
              { value: '100%',     label: 'Free',          sub: 'No subscription ever' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="text-center p-6 bg-teal-50 rounded-2xl border border-teal-100">
                <p className="text-4xl font-extrabold text-teal-600">{value}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-12 shadow-2xl shadow-teal-200">
            <h3 className="text-3xl font-extrabold text-white mb-3">Join HumDard Today</h3>
            <p className="text-teal-100 text-lg mb-8 max-w-md mx-auto">
              Be part of Pakistan's most trusted community platform. Free, forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup/citizen"
                className="px-10 py-4 bg-white text-teal-700 font-bold text-lg rounded-2xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5"
              >
                🙋 Sign Up as Citizen
              </Link>
              <Link
                to="/signup/ngo"
                className="px-10 py-4 bg-teal-400/30 hover:bg-teal-400/50 text-white font-bold text-lg rounded-2xl border-2 border-white/30 transition-all"
              >
                🏢 Register NGO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6 text-center">
        <p className="text-xl font-extrabold text-white mb-1">HumDard</p>
        <p className="text-sm text-gray-500 mb-4">ہم درد — Pakistan Ki Awaaz</p>
        <div className="flex justify-center gap-6 text-sm mb-6">
          <Link to="/signup/citizen"   className="hover:text-teal-400 transition-colors">Citizens</Link>
          <Link to="/signup/ngo"       className="hover:text-teal-400 transition-colors">NGOs</Link>
          <Link to="/signup/volunteer" className="hover:text-teal-400 transition-colors">Volunteers</Link>
          <Link to="/signin"           className="hover:text-teal-400 transition-colors">Sign In</Link>
        </div>
        <p className="text-xs text-gray-600">© 2026 HumDard. Built with ❤️ for Pakistan.</p>
      </footer>
    </div>
  )
}
