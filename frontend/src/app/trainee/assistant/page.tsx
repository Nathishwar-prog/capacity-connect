'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Compass,
  BookOpen,
  Brain,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'assistant',
    content:
      'Greetings! I am your Capacity Connect Atmospheric Science Learning Assistant. I can assist you with Doppler weather radar mechanics, Numerical Weather Prediction (NWP) assimilation, synoptic tropical cyclone genesis, WMO manuals, and practice assessment preparation. How may I support your training today?',
    timestamp: 'Just now',
  },
];

const PROMPT_SUGGESTIONS = [
  'Explain Doppler Velocity Azimuth Display (VAD) analysis',
  'What triggers Tropical Cyclogenesis in the Bay of Bengal?',
  'How does 4D-Var data assimilation improve WRF forecasts?',
  'Explain AWS calibration for tipping bucket rain gauges',
  'Generate 3 practice questions on monsoon depressions',
];

export default function TraineeAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateDomainResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('vad') || q.includes('radar') || q.includes('doppler')) {
      return `### Doppler Radar: Velocity Azimuth Display (VAD)

**Velocity Azimuth Display (VAD)** is a technique used in operational Doppler weather radar to retrieve vertical profiles of horizontal wind speed and direction:

1. **Measurement Principle:**
   - The radar antenna executes a conical 360° PPI scan at a constant elevation angle (e.g., $0.5^\\circ$ to $19.5^\\circ$).
   - The Doppler radial velocity $V_r(\\theta)$ varies sinusoidally as a function of antenna azimuth angle $\\theta$:
     $$V_r(\\theta) = V_h \\cos(\\theta - \\theta_0) \\cos(\\alpha) + w \\sin(\\alpha)$$
     where $V_h$ is horizontal wind speed, $\\theta_0$ is wind direction, $\\alpha$ is elevation angle, and $w$ is vertical motion/hydrometeor terminal fall speed.

2. **Operational Meteorological Utilities:**
   - **Wind Shear Detection:** Identifies low-level wind shear (LLWS) critical for aviation safety.
   - **Mesoscale Convergence:** Divergence/convergence is computed from the offset of the sinusoidal zero-line.
   - **Data Assimilation (NWP):** VAD wind vectors from IMD's S-band and C-band network are assimilated into NCMRWF GFS and WRF models.`;
    }

    if (q.includes('cyclone') || q.includes('bay of bengal') || q.includes('genesis')) {
      return `### Tropical Cyclogenesis in the Bay of Bengal & North Indian Ocean

Tropical cyclogenesis in the North Indian Ocean peaks during pre-monsoon (April–May) and post-monsoon (October–December) seasons due to the following primary thermodynamic and dynamic triggers:

1. **Sea Surface Temperatures (SST):**
   - High ocean thermal energy with SSTs $\\ge 28^\\circ\\text{C}$ and deep Oceanic Heat Content (OHC $> 50\\text{ kJ/cm}^2$).
2. **Low Vertical Wind Shear:**
   - Magnitude of vertical wind shear between 850 hPa and 200 hPa must be low to moderate ($< 10\\text{--}15\\text{ knots}$).
3. **Mid-Tropospheric Moisture:**
   - Relative humidity $> 60\\%$ at 700 hPa and 500 hPa to prevent dry air entrainment from suppressing deep convection.
4. **Coriolis Parameter:**
   - Latitude $\\ge 5^\\circ\\text{N}$ allows planetary vorticity to initiate cyclonic spin-up.
5. **Pre-existing Synoptic Disturbance:**
   - Madden-Julian Oscillation (MJO) active phase in Phase 3/4 or passing equatorial Kelvin/Rossby waves.`;
    }

    if (q.includes('4d-var') || q.includes('assimilation') || q.includes('wrf') || q.includes('nwp')) {
      return `### 4D-Var Data Assimilation in Operational NWP

**Four-Dimensional Variational Data Assimilation (4D-Var)** is the benchmark method used at NCMRWF and IMD:

- **Time-Distributed Observations:** Unlike 3D-Var which treats all observations within a 6-hour window as synoptic at $t_0$, 4D-Var incorporates observations at their exact observed timestamps.
- **Physical Consistency:** Uses the tangent linear and adjoint models to propagate observation increments forward and backward in time, ensuring wind and pressure fields stay in geostrophic and convective balance.
- **Precipitation Improvements:** Significantly reduces false alarm rates for convective cloudbursts by accurately assimilating INSAT-3D radiance and Doppler radar radial velocity fields.`;
    }

    if (q.includes('aws') || q.includes('rain gauge') || q.includes('sensor') || q.includes('tipping bucket')) {
      return `### Automated Weather Station (AWS) Maintenance: Tipping Bucket Protocol

Operational guidelines for maintenance and calibration of IMD tipping bucket rain gauges (TBRG):

1. **Mechanical Inspection:**
   - Inspect funnel orifice (standard $200\\text{ mm}$ aperture) for debris, bird droppings, and leaves.
   - Clean the sapphire pivot bearings with isopropyl alcohol; verify smooth dual-bucket seesaw action without friction.
2. **Static & Dynamic Calibration:**
   - Deliver a known volume of water (e.g., $314\\text{ ml}$ corresponding to $10\\text{ mm}$ of rainfall for a $200\\text{ mm}$ rim) through a calibrated drip nozzle at varying intensities ($20\\text{ mm/hr}$ and $100\\text{ mm/hr}$).
   - Adjust the balance stop screws so each tip precisely records $0.5\\text{ mm}$ or $0.2\\text{ mm}$ per pulse.
3. **Telemetry & Datalogger:**
   - Verify reed switch contact debouncing in the datalogger counter channel; ensure satellite INSAT/GPRS transmission packets match local flash counts.`;
    }

    if (q.includes('practice') || q.includes('question') || q.includes('quiz')) {
      return `### Practice Review: Monsoon Depressions & Synoptic Systems

Here are 3 practice questions to benchmark your assessment preparation:

**Question 1 (Radar Meteorology):**
*In a Doppler velocity PPI display, what does a zero-velocity band oriented along the antenna beam direction indicate?*
- **A)** Wind blowing exactly along the line of sight
- **B)** Wind blowing perpendicular to the radar beam
- **C)** Complete absence of horizontal wind
- **Answer:** **B** (Radial velocity $V_r = V_h \\cos(90^\\circ) = 0$).

---

**Question 2 (Synoptic Dynamics):**
*Where does the strongest convective rainfall occur relative to the center of an westward-moving Indian Monsoon Depression?*
- **A)** South-Western quadrant
- **B)** North-Eastern quadrant
- **C)** Due East of the center
- **Answer:** **A** (Due to maximum low-level moisture convergence and cyclonic vorticity advection in the south-west sector).

---

**Question 3 (Satellite Meteorology):**
*Which spectral channel on INSAT-3D is most sensitive to upper-tropospheric moisture content?*
- **A)** Visible ($0.65\\,\\mu\\text{m}$)
- **B)** Thermal Infrared ($10.8\\,\\mu\\text{m}$)
- **C)** Water Vapor ($6.7\\,\\mu\\text{m}$)
- **Answer:** **C** ($6.7\\,\\mu\\text{m}$ channel absorbs radiation emitted by water vapor between $300\\text{--}600\\text{ hPa}$).`;
    }

    return `### Atmospheric Science Guidance on: "${query}"

Thank you for your inquiry. In operational meteorology and MoES standards:

1. **Theoretical Foundation:** This topic aligns directly with standard meteorological thermodynamics and fluid dynamics outlined in WMO Publication No. 558 and IMD training manuals.
2. **Operational Applications:** When preparing forecast guidance or interpreting synoptic observations, cross-validate numerical model guidance (e.g. NCMRWF GFS / Unified Model) against real-time Doppler radar observations and INSAT rapid scans.
3. **Curriculum Recommendation:** Review the official technical note in your **Learning Resources** tab or run an **Adaptive Revision Session** on this specific topic to solidify competency points.

Feel free to ask for a deeper derivation, formula breakdown, or specific case study!`;
  };

  const handleSend = (text?: string) => {
    const query = text || inputMessage;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const responseContent = generateDomainResponse(query);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-4 pb-16 flex flex-col h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Meteorological Tutor
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
                Atmospheric Science Learning Assistant
              </h1>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Clear Chat</span>
            </Button>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 flex flex-col overflow-hidden bg-white border-slate-200 rounded-3xl shadow-sm">
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs space-y-2'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    <div
                      className={`flex items-center justify-between gap-4 pt-1 text-[10px] ${
                        msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-slate-700 transition-colors flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-xl">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-100" />
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-200" />
                    <span className="ml-1 text-[11px] font-semibold text-indigo-700">
                      Synthesizing meteorological guidance...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Suggestions Bar */}
            {messages.length <= 2 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 overflow-x-auto flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  Suggestions:
                </span>
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="text-[11px] font-medium text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200/80 whitespace-nowrap transition-colors shrink-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <Input
                placeholder="Ask about Doppler radar, NWP data assimilation, AWS calibration, or WMO standards..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isTyping}
                className="text-xs rounded-xl flex-1 bg-slate-50 focus:bg-white"
              />
              <Button
                type="submit"
                disabled={isTyping || !inputMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 rounded-xl shadow-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Ask</span>
              </Button>
            </form>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
