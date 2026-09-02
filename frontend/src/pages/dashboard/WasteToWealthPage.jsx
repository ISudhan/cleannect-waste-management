import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

// Sample demo waste items for instant 1-click testing
const sampleWasteItems = [
  {
    id: 'sample-plastic',
    name: 'PET Plastic Bottles',
    category: 'plastic',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
    notes: 'Clean transparent plastic bottles and milk jugs, approximately 5kg batch.',
  },
  {
    id: 'sample-metal',
    name: 'Copper & Aluminum Scrap',
    category: 'metal',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    notes: 'Stripped electrical copper wiring and soda beverage cans.',
  },
  {
    id: 'sample-paper',
    name: 'Corrugated Cardboard Box',
    category: 'paper',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=80',
    notes: 'Heavy duty packaging delivery cartons and newspapers.',
  },
  {
    id: 'sample-ewaste',
    name: 'Computer Circuit Boards & Cables',
    category: 'electronic',
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=80',
    notes: 'Defunct motherboard, RAM sticks, and connector cables.',
  },
];

const analysisSteps = [
  '📸 Ingesting & normalizing multi-modal image tensor...',
  '🔬 Scanning polymer structure & chemical composition...',
  '📊 Querying live Indian scrap market price indices (INR ₹)...',
  '💡 Formulating DIY blueprints & industrial valorization pathways...',
  '🌿 Finalizing carbon offset & circular economy metrics...',
];

export default function WasteToWealthPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('diy'); // 'diy' | 'industrial' | 'valuation' | 'calculator'
  const [calcWeightKg, setCalcWeightKg] = useState(25);
  const [error, setError] = useState(null);

  // Animate progress steps during analysis
  useEffect(() => {
    let interval = null;
    if (analyzing) {
      setAnalysisStepIndex(0);
      interval = setInterval(() => {
        setAnalysisStepIndex((prev) => (prev + 1) % analysisSteps.length);
      }, 750);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analyzing]);

  // Handle file upload selection
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setError(null);
    }
  }

  // Handle Sample Item Selection
  function handleSelectSample(sample) {
    setPreviewUrl(sample.image);
    setSelectedImage(null);
    setNotes(sample.notes);
    setAnalysisResult(null);
    setError(null);
    triggerAnalysisWithNotes(sample.notes, sample.name);
  }

  // Trigger Gemini Analysis
  async function handleAnalyze(e) {
    if (e) e.preventDefault();
    if (!selectedImage && !previewUrl) {
      setError('Please upload an image or choose a sample waste item.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      if (selectedImage) {
        // Send as FormData
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('notes', notes);

        const res = await apiClient.post('/gemini/analyze-waste', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success) {
          setAnalysisResult(res.data.data);
        }
      } else {
        // Sample item query
        const res = await apiClient.post('/gemini/analyze-waste', {
          notes: `${notes} (Item photo sample provided)`,
        });

        if (res.data?.success) {
          setAnalysisResult(res.data.data);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.message || 'Failed to analyze waste item. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  // Quick helper for sample direct trigger
  async function triggerAnalysisWithNotes(sampleNotes, sampleName) {
    setAnalyzing(true);
    try {
      const res = await apiClient.post('/gemini/analyze-waste', {
        notes: `${sampleName}: ${sampleNotes}`,
      });
      if (res.data?.success) {
        setAnalysisResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  // Navigate to create listing with pre-filled fields
  function handleCreateListingFromAnalysis() {
    if (!analysisResult?.wealthOutOfWaste?.quickListing) return;
    const item = analysisResult.wealthOutOfWaste.quickListing;
    sessionStorage.setItem('prefill_listing', JSON.stringify({
      title: item.title,
      description: item.description,
      category: item.category || 'other',
      price: item.suggestedPrice || 25,
      unit: item.unit || 'kg',
      quantity: calcWeightKg || 10,
    }));
    navigate('/dashboard/listings/new');
  }

  const classification = analysisResult?.wasteClassification;
  const wow = analysisResult?.wealthOutOfWaste;

  // Real-time live calculator metrics
  const minPrice = wow?.scrapValuation?.estimatedPricePerKgMin || 15;
  const maxPrice = wow?.scrapValuation?.estimatedPricePerKgMax || 30;
  const avgPrice = Math.round((minPrice + maxPrice) / 2);
  const totalEstimatedEarnings = Math.round(calcWeightKg * avgPrice);
  const totalCo2Offset = (calcWeightKg * (wow?.environmentalImpact?.co2OffsetKgPerKg || 1.8)).toFixed(1);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-6 md:p-10 text-white shadow-2xl">
        <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 text-xs font-bold text-emerald-300 mb-4 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Google Gemini Multimodal AI</span>
            <span>•</span>
            <span>Real-Time Waste Valorization</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Wealth out of Waste (WoW) Studio
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed">
            Upload any photo of garbage or discarded material. CleanNect's Gemini AI will instantly identify the composition, evaluate scrap market valuation, generate DIY upcycling blueprints, and formulate industrial recycling pathways.
          </p>
        </div>
      </div>

      {/* ── Main Layout: Uploader & Analysis Output ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Sample Selector */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📸</span>
              <span>Upload Waste Photo for AI Inspection</span>
            </h2>

            {/* Dropzone / Preview Area */}
            <label className="relative flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 transition-all cursor-pointer overflow-hidden p-4 group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-inner">
                  <img
                    src={previewUrl}
                    alt="Waste preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <span>🔄 Click to replace photo</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-2xl mb-2 group-hover:scale-110 transition-transform">
                    📤
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Click to browse or drag & drop photo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports JPG, PNG, WEBP (Max 10MB)
                  </p>
                </div>
              )}
            </label>

            {/* Optional Description / Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Context Notes & Estimated Weight (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 10kg clean water bottles with caps"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || (!selectedImage && !previewUrl)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 text-sm transition-all shadow-lg hover:shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <span className="spinner h-4 w-4 border-white" />
                  <span>Gemini Inspecting in Real Time...</span>
                </>
              ) : (
                <>
                  <span>✨ Inspect & Generate Wealth Ideas</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Sample Picker */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Or Try Quick Sample Photos:
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {sampleWasteItems.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="flex items-center gap-2.5 p-2 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition-all group"
                >
                  <img
                    src={sample.image}
                    alt={sample.name}
                    className="h-10 w-10 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{sample.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{sample.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Results Studio */}
        <div className="lg:col-span-7 space-y-5">
          {analyzing ? (
            /* Progressive Loading State */
            <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[480px] space-y-5">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute h-full w-full rounded-full bg-emerald-400/30 animate-ping" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white text-3xl font-bold shadow-lg">
                  ✨
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Gemini Multimodal AI is Processing Waste
                </h3>
                <p className="text-xs text-emerald-600 font-semibold mt-2 animate-pulse bg-emerald-50 px-4 py-1.5 rounded-full inline-block">
                  {analysisSteps[analysisStepIndex]}
                </p>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Generating high-fidelity DIY blueprints, industrial circular economy pathways, and market scrap valuations in real time.
              </p>
            </div>
          ) : analysisResult ? (
            /* Complete Analysis View */
            <div className="space-y-5 animate-fade-in">
              {/* Material Classification Header Card */}
              <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase">
                        {classification?.primaryMaterial || 'Waste Item'}
                      </span>
                      {classification?.subCategory && (
                        <span className="text-xs text-slate-400 font-medium">
                          • {classification.subCategory}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2">
                      {classification?.itemName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Condition: <strong className="text-slate-800">{classification?.condition}</strong>
                    </p>
                  </div>

                  {/* Purity & Recyclability Badge */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="text-center">
                      <span className="text-xl font-black text-emerald-600">
                        {classification?.purityScore || 85}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Purity</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-center">
                      <span className="text-xl">♻️</span>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Recyclable</p>
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                {wow?.summary && (
                  <div className="mt-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 p-3.5 text-xs text-emerald-950 font-medium leading-relaxed">
                    💡 <strong>Wealth Opportunity:</strong> {wow.summary}
                  </div>
                )}
              </div>

              {/* Navigation Tabs for Analysis Depth */}
              <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('diy')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'diy'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💡 DIY Upcycling ({wow?.diyUpcycling?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('industrial')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'industrial'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏭 Industrial Recycling
                </button>
                <button
                  onClick={() => setActiveTab('valuation')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'valuation'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💰 Scrap Market Value
                </button>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'calculator'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📈 Profit Calculator
                </button>
              </div>

              {/* Tab 1: DIY Upcycling Projects */}
              {activeTab === 'diy' && (
                <div className="space-y-4">
                  {wow?.diyUpcycling?.map((project, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{project.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{project.description}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            ⏳ {project.timeRequired}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold">
                            🎯 {project.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Tools Needed */}
                      {project.toolsNeeded && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                            Tools:
                          </span>
                          {project.toolsNeeded.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Step by Step Blueprint */}
                      {project.steps && (
                        <div className="mt-3 bg-slate-50/80 rounded-2xl p-4 space-y-2 border border-slate-100">
                          <p className="text-xs font-bold text-slate-700">🛠️ Step-by-Step Blueprint:</p>
                          <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside">
                            {project.steps.map((step, sIdx) => (
                              <li key={sIdx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Industrial Recycling */}
              {activeTab === 'industrial' && wow?.industrialRecycling && (
                <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Industrial Reprocessing & Circular Economy
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {wow.industrialRecycling.processDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                        Commercial End Products
                      </span>
                      <ul className="mt-2 space-y-1 text-xs text-teal-950">
                        {wow.industrialRecycling.endProducts?.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Market Demand
                      </span>
                      <p className="mt-2 text-sm font-bold text-slate-800">
                        {wow.industrialRecycling.industrialDemand}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        High buyback liquidity in local recyclers
                      </p>
                    </div>
                  </div>

                  {wow.environmentalImpact && (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-950 text-white mt-2">
                      <div>
                        <span className="text-xs font-semibold text-emerald-300 uppercase">
                          Carbon Offset
                        </span>
                        <p className="text-lg font-black">
                          {wow.environmentalImpact.co2OffsetKgPerKg} kg CO2e / kg
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                        {wow.environmentalImpact.ecoBadge || 'Zero Waste'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Scrap Market Valuation */}
              {activeTab === 'valuation' && wow?.scrapValuation && (
                <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Indicative Scrap Market Rates (India)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Real-time estimated scrap buyback rates
                      </p>
                    </div>
                    <span className="text-2xl">💵</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase text-emerald-100">
                        Estimated Scrap Price Range
                      </span>
                      <div className="text-3xl font-black mt-1">
                        ₹{wow.scrapValuation.estimatedPricePerKgMin} - ₹
                        {wow.scrapValuation.estimatedPricePerKgMax}{' '}
                        <span className="text-sm font-medium">/ {wow.scrapValuation.unit}</span>
                      </div>
                    </div>
                    <span className="text-3xl">📈</span>
                  </div>

                  {wow.safetyAndPrep && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-700">
                        ✨ How to Maximize Buyback Value:
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {wow.safetyAndPrep.map((tip, idx) => (
                          <li key={idx}>✓ {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Live Profitability Calculator */}
              {activeTab === 'calculator' && (
                <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Live Scrap Valuation & Earnings Calculator
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Drag the slider to calculate instant bulk scrap income
                      </p>
                    </div>
                    <span className="text-2xl">🧮</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        Select Quantity ({classification?.primaryMaterial || 'Waste'}):
                      </label>
                      <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                        {calcWeightKg} KG
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="500"
                      step="5"
                      value={calcWeightKg}
                      onChange={(e) => setCalcWeightKg(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase">
                        Estimated Revenue
                      </span>
                      <p className="text-2xl font-black text-emerald-950 mt-1">
                        ₹{totalEstimatedEarnings}
                      </p>
                      <span className="text-[10px] text-emerald-700">
                        @ ₹{avgPrice}/kg average index
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                      <span className="text-[11px] font-bold text-teal-800 uppercase">
                        Carbon Offset
                      </span>
                      <p className="text-2xl font-black text-teal-950 mt-1">
                        {totalCo2Offset} kg
                      </p>
                      <span className="text-[10px] text-teal-700">CO2 emissions avoided</span>
                    </div>
                  </div>
                </div>
              )}

              {/* One Click Marketplace Publish Card */}
              {wow?.quickListing && (
                <div className="rounded-3xl bg-slate-950 text-white p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      Instant Monetization
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      Ready to sell this on CleanNect Marketplace?
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Auto-fill listing title, category, description, and market price in 1-click.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateListingFromAnalysis}
                    className="flex-shrink-0 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg active:scale-95"
                  >
                    🛍️ Publish Listing Now →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl bg-white p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[480px] space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-3xl">
                ✨
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Ready for AI Waste Inspection
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload a photo or choose one of the sample waste materials on the left to see live Wealth out of Waste blueprints!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
