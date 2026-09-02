import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

// ---------------------------------------------------------
// Demo waste items
// ---------------------------------------------------------
const sampleWasteItems = [
  {
    id: 'sample-plastic',
    name: 'PET Plastic Bottles',
    category: 'plastic',
    image:
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
    notes:
      'Clean transparent PET plastic bottles and milk jugs, approximately 5kg batch.',
  },
  {
    id: 'sample-metal',
    name: 'Copper & Aluminum Scrap',
    category: 'metal',
    image:
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    notes:
      'Stripped electrical copper wiring and aluminum beverage cans.',
  },
  {
    id: 'sample-paper',
    name: 'Corrugated Cardboard Box',
    category: 'paper',
    image:
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=80',
    notes:
      'Heavy-duty packaging delivery cartons and newspapers.',
  },
  {
    id: 'sample-ewaste',
    name: 'Computer Circuit Boards & Cables',
    category: 'electronic',
    image:
      'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=80',
    notes:
      'Defunct motherboard, RAM sticks, connector cables and electronic components.',
  },
];

// ---------------------------------------------------------
// Analysis progress messages
// ---------------------------------------------------------
const analysisSteps = [
  '📸 Processing the waste image...',
  '🔬 Identifying material and condition...',
  '📊 Estimating indicative scrap value...',
  '💡 Generating DIY upcycling ideas...',
  '🏭 Generating industrial recycling pathways...',
  '🌿 Calculating environmental impact...',
];

// ---------------------------------------------------------
// Helper: safely convert API values to arrays
// ---------------------------------------------------------
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// ---------------------------------------------------------
// Helper: extract analysis object regardless of slight
// differences in backend response structure
// ---------------------------------------------------------
function extractAnalysisResponse(response) {
  const payload = response?.data;

  if (!payload?.success) {
    return null;
  }

  // Possible structures:
  // { success: true, data: {...} }
  // { success: true, data: { analysis: {...} } }
  // { success: true, analysis: {...} }

  return (
    payload?.data?.analysis ||
    payload?.data ||
    payload?.analysis ||
    null
  );
}

export default function WasteToWealthPage() {
  const navigate = useNavigate();

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [activeTab, setActiveTab] = useState('diy');

  const [calcWeightKg, setCalcWeightKg] = useState(25);

  const [error, setError] = useState(null);

  // -------------------------------------------------------
  // Animate analysis progress
  // -------------------------------------------------------
  useEffect(() => {
    if (!analyzing) {
      return undefined;
    }

    setAnalysisStepIndex(0);

    const interval = setInterval(() => {
      setAnalysisStepIndex((prev) => {
        if (prev >= analysisSteps.length - 1) {
          return 0;
        }

        return prev + 1;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [analyzing]);

  // -------------------------------------------------------
  // Cleanup object URLs
  // -------------------------------------------------------
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // -------------------------------------------------------
  // File upload
  // -------------------------------------------------------
  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // 10 MB maximum
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError('Image size must be less than 10MB.');
      return;
    }

    // Revoke previous object URL
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);

    setSelectedImage(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
    setError(null);
    setActiveTab('diy');
  }

  // -------------------------------------------------------
  // Sample item selection
  // -------------------------------------------------------
  function handleSelectSample(sample) {
    setPreviewUrl(sample.image);
    setSelectedImage(null);
    setNotes(sample.notes);
    setAnalysisResult(null);
    setError(null);
    setActiveTab('diy');

    // Automatically analyze sample
    triggerAnalysisWithNotes(sample.notes, sample.name);
  }

  // -------------------------------------------------------
  // Analyze uploaded image
  // -------------------------------------------------------
  async function handleAnalyze(event) {
    event?.preventDefault();

    if (!selectedImage && !previewUrl) {
      setError(
        'Please upload an image or choose a sample waste item.'
      );
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let response;

      if (selectedImage) {
        // -----------------------------------------------
        // Real uploaded image
        // -----------------------------------------------
        const formData = new FormData();

        formData.append('image', selectedImage);
        formData.append('notes', notes || '');

        // IMPORTANT:
        // Do NOT manually set Content-Type here.
        // Axios/browser will automatically add the multipart
        // boundary.
        response = await apiClient.post(
          '/gemini/analyze-waste',
          formData
        );
      } else {
        // -----------------------------------------------
        // Sample image
        // -----------------------------------------------
        response = await apiClient.post(
          '/gemini/analyze-waste',
          {
            notes: `${notes || ''} (This is a demo sample waste item.)`,
          }
        );
      }

      const result = extractAnalysisResponse(response);

      if (!result) {
        throw new Error(
          response?.data?.message ||
          response?.data?.error ||
          'Gemini returned an invalid analysis response.'
        );
      }

      setAnalysisResult(result);
      setActiveTab('diy');
    } catch (err) {
      console.error('Waste analysis error:', err);

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to analyze waste item. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  // -------------------------------------------------------
  // Analyze demo sample
  // -------------------------------------------------------
  async function triggerAnalysisWithNotes(sampleNotes, sampleName) {
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await apiClient.post(
        '/gemini/analyze-waste',
        {
          notes: `${sampleName}: ${sampleNotes}. This is a demo sample image.`,
        }
      );

      const result = extractAnalysisResponse(response);

      if (!result) {
        throw new Error(
          response?.data?.message ||
          response?.data?.error ||
          'Gemini returned an invalid analysis response.'
        );
      }

      setAnalysisResult(result);
      setActiveTab('diy');
    } catch (err) {
      console.error('Sample analysis error:', err);

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to analyze sample item.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  // -------------------------------------------------------
  // Create marketplace listing
  // -------------------------------------------------------
  function handleCreateListingFromAnalysis() {
    const item = analysisResult?.wealthOutOfWaste?.quickListing;

    if (!item) {
      setError('No marketplace listing data was generated.');
      return;
    }

    const prefillListing = {
      title: item.title || 'Recyclable Waste Material',

      description:
        item.description ||
        'Recyclable waste material identified by CleanNect AI.',

      category: item.category || 'other',

      price: Number(item.suggestedPrice) || 25,

      unit: item.unit || 'kg',

      quantity: Number(calcWeightKg) || 10,
    };

    sessionStorage.setItem(
      'prefill_listing',
      JSON.stringify(prefillListing)
    );

    navigate('/dashboard/listings/new');
  }

  // -------------------------------------------------------
  // Analysis data
  // -------------------------------------------------------
  const classification =
    analysisResult?.wasteClassification || {};

  const wow =
    analysisResult?.wealthOutOfWaste || {};

  const industrialRecycling =
    wow?.industrialRecycling || {};

  const scrapValuation =
    wow?.scrapValuation || {};

  const environmentalImpact =
    wow?.environmentalImpact || {};

  const diyProjects =
    safeArray(wow?.diyUpcycling);

  const safetyTips =
    safeArray(wow?.safetyAndPrep);

  const endProducts =
    safeArray(industrialRecycling?.endProducts);

  // -------------------------------------------------------
  // Calculator
  // -------------------------------------------------------
  const minPrice =
    Number(scrapValuation?.estimatedPricePerKgMin) || 15;

  const maxPrice =
    Number(scrapValuation?.estimatedPricePerKgMax) || 30;

  const avgPrice =
    Math.round((minPrice + maxPrice) / 2);

  const totalEstimatedEarnings =
    Math.round(calcWeightKg * avgPrice);

  const co2PerKg =
    Number(environmentalImpact?.co2OffsetKgPerKg) || 1.8;

  const totalCo2Offset =
    (calcWeightKg * co2PerKg).toFixed(1);

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">

      {/* =====================================================
          HERO
      ====================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-6 text-white shadow-2xl md:p-10">

        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md">

            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />

            <span>Google Gemini Multimodal AI</span>

            <span>•</span>

            <span>Waste Valorization</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            Wealth out of Waste (WoW) Studio
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
            Upload a photo of discarded material. CleanNect AI identifies
            the material, estimates indicative scrap value, generates
            upcycling ideas, and suggests industrial recycling pathways.
          </p>

        </div>
      </div>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* ===================================================
            LEFT COLUMN
        ==================================================== */}
        <div className="space-y-5 lg:col-span-5">

          {/* Upload card */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span>📸</span>
              <span>Upload Waste Photo for AI Inspection</span>
            </h2>

            {/* Dropzone */}
            <label className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50/30">

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative h-48 w-full overflow-hidden rounded-xl shadow-inner">

                  <img
                    src={previewUrl}
                    alt="Waste preview"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    🔄 Click to replace photo
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center p-4 text-center">

                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700 transition-transform group-hover:scale-110">
                    📤
                  </div>

                  <p className="text-sm font-bold text-slate-700">
                    Click to browse or drag & drop photo
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Supports JPG, PNG, WEBP — Max 10MB
                  </p>

                </div>
              )}

            </label>

            {/* Notes */}
            <div>

              <label className="mb-1 block text-xs font-bold text-slate-600">
                Context Notes & Estimated Weight
              </label>

              <input
                type="text"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="e.g. 10kg clean water bottles with caps"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                ⚠️ {error}
              </div>
            )}

            {/* Analyze */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={
                analyzing ||
                (!selectedImage && !previewUrl)
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <span className="spinner h-4 w-4 border-white" />
                  <span>Gemini Inspecting...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Inspect & Generate Wealth Ideas</span>
                </>
              )}
            </button>

          </div>

          {/* Sample picker */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Or Try Quick Sample Photos
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">

              {sampleWasteItems.map((sample) => (
                <button
                  type="button"
                  key={sample.id}
                  onClick={() =>
                    handleSelectSample(sample)
                  }
                  disabled={analyzing}
                  className="group flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-2 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/60 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <img
                    src={sample.image}
                    alt={sample.name}
                    className="h-10 w-10 flex-shrink-0 rounded-xl object-cover transition group-hover:scale-105"
                  />

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-xs font-bold text-slate-800">
                      {sample.name}
                    </p>

                    <p className="text-[10px] capitalize text-slate-400">
                      {sample.category}
                    </p>

                  </div>

                </button>
              ))}

            </div>
          </div>

        </div>

        {/* ===================================================
            RIGHT COLUMN
        ==================================================== */}
        <div className="space-y-5 lg:col-span-7">

          {/* =================================================
              LOADING
          ================================================== */}
          {analyzing ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center space-y-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="relative flex h-20 w-20 items-center justify-center">

                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400/30" />

                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-bold text-white shadow-lg">
                  ✨
                </span>

              </div>

              <div>

                <h3 className="text-lg font-bold text-slate-900">
                  Gemini Multimodal AI is Processing Waste
                </h3>

                <p className="mt-2 inline-block animate-pulse rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-600">
                  {analysisSteps[analysisStepIndex]}
                </p>

              </div>

              <p className="max-w-sm text-xs text-slate-400">
                Generating material classification, upcycling ideas,
                recycling pathways, indicative valuation and environmental
                metrics.
              </p>

            </div>

          ) : analysisResult ? (

            /* =================================================
               RESULTS
            ================================================== */
            <div className="animate-fade-in space-y-5">

              {/* Classification */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold uppercase text-emerald-800">
                        {classification?.primaryMaterial ||
                          'Waste Item'}
                      </span>

                      {classification?.subCategory && (
                        <span className="text-xs font-medium text-slate-400">
                          • {classification.subCategory}
                        </span>
                      )}

                    </div>

                    <h2 className="mt-2 text-xl font-extrabold text-slate-900 md:text-2xl">
                      {classification?.itemName ||
                        'Waste Material'}
                    </h2>

                    {classification?.condition && (
                      <p className="mt-1 text-xs text-slate-500">
                        Condition:{' '}
                        <strong className="text-slate-800">
                          {classification.condition}
                        </strong>
                      </p>
                    )}

                  </div>

                  {/* Purity */}
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">

                    <div className="text-center">

                      <span className="text-xl font-black text-emerald-600">
                        {classification?.purityScore ??
                          85}
                        %
                      </span>

                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Purity
                      </p>

                    </div>

                    <div className="h-8 w-px bg-slate-200" />

                    <div className="text-center">

                      <span className="text-xl">
                        ♻️
                      </span>

                      <p className="text-[10px] font-bold uppercase text-emerald-600">
                        Recyclable
                      </p>

                    </div>

                  </div>

                </div>

                {wow?.summary && (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 text-xs font-medium leading-relaxed text-emerald-950">
                    💡 <strong>Wealth Opportunity:</strong>{' '}
                    {wow.summary}
                  </div>
                )}

              </div>

              {/* =================================================
                  TABS
              ================================================== */}
              <div className="flex overflow-x-auto rounded-2xl border-b border-slate-200 bg-white p-1.5 shadow-sm">

                {[
                  ['diy', `💡 DIY Upcycling (${diyProjects.length})`],
                  ['industrial', '🏭 Industrial Recycling'],
                  ['valuation', '💰 Scrap Market Value'],
                  ['calculator', '📈 Profit Calculator'],
                ].map(([tab, label]) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${activeTab === tab
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    {label}
                  </button>
                ))}

              </div>

              {/* =================================================
                  DIY TAB
              ================================================== */}
              {activeTab === 'diy' && (
                <div className="space-y-4">

                  {diyProjects.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                      No DIY upcycling projects were returned by Gemini.
                    </div>
                  ) : (
                    diyProjects.map((project, index) => (
                      <div
                        key={`${project?.title || 'project'}-${index}`}
                        className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >

                        <div className="flex items-start justify-between gap-2">

                          <div>

                            <div className="flex items-center gap-2">

                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                                {index + 1}
                              </span>

                              <h3 className="text-base font-bold text-slate-900">
                                {project?.title ||
                                  'Upcycling Project'}
                              </h3>

                            </div>

                            {project?.description && (
                              <p className="mt-1 text-xs text-slate-500">
                                {project.description}
                              </p>
                            )}

                          </div>

                          <div className="flex flex-shrink-0 flex-col items-end gap-1">

                            {project?.timeRequired && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                ⏳ {project.timeRequired}
                              </span>
                            )}

                            {project?.difficulty && (
                              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                                🎯 {project.difficulty}
                              </span>
                            )}

                          </div>

                        </div>

                        {/* Tools */}
                        {safeArray(project?.toolsNeeded).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">

                            <span className="mr-1 text-[10px] font-bold uppercase text-slate-400">
                              Tools:
                            </span>

                            {project.toolsNeeded.map((tool, toolIndex) => (
                              <span
                                key={toolIndex}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                              >
                                {tool}
                              </span>
                            ))}

                          </div>
                        )}

                        {/* Steps */}
                        {safeArray(project?.steps).length > 0 && (
                          <div className="mt-3 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">

                            <p className="text-xs font-bold text-slate-700">
                              🛠️ Step-by-Step Blueprint
                            </p>

                            <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-600">

                              {project.steps.map(
                                (step, stepIndex) => (
                                  <li
                                    key={stepIndex}
                                    className="leading-relaxed"
                                  >
                                    {step}
                                  </li>
                                )
                              )}

                            </ol>

                          </div>
                        )}

                      </div>
                    ))
                  )}

                </div>
              )}

              {/* =================================================
                  INDUSTRIAL TAB
              ================================================== */}
              {activeTab === 'industrial' && (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div>

                    <h3 className="text-base font-bold text-slate-900">
                      Industrial Reprocessing & Circular Economy
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {industrialRecycling?.processDescription ||
                        'No industrial recycling process was returned.'}
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">

                    <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">

                      <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                        Commercial End Products
                      </span>

                      {endProducts.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-teal-950">

                          {endProducts.map((product, index) => (
                            <li key={index}>
                              • {product}
                            </li>
                          ))}

                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-teal-900">
                          No end products returned.
                        </p>
                      )}

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Market Demand
                      </span>

                      <p className="mt-2 text-sm font-bold text-slate-800">
                        {industrialRecycling?.industrialDemand ||
                          'Not available'}
                      </p>

                    </div>

                  </div>

                  <div className="mt-2 flex items-center justify-between rounded-2xl bg-emerald-950 p-4 text-white">

                    <div>

                      <span className="text-xs font-semibold uppercase text-emerald-300">
                        Carbon Offset
                      </span>

                      <p className="text-lg font-black">
                        {co2PerKg} kg CO₂e / kg
                      </p>

                    </div>

                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                      {environmentalImpact?.ecoBadge ||
                        'Circular Economy'}
                    </span>

                  </div>

                </div>
              )}

              {/* =================================================
                  VALUATION TAB
              ================================================== */}
              {activeTab === 'valuation' && (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="text-base font-bold text-slate-900">
                        Indicative Scrap Market Rates
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        AI-generated estimate — actual rates vary by
                        location, grade and buyer.
                      </p>

                    </div>

                    <span className="text-2xl">
                      💵
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-md">

                    <div>

                      <span className="text-xs font-bold uppercase text-emerald-100">
                        Estimated Scrap Price Range
                      </span>

                      <div className="mt-1 text-3xl font-black">

                        ₹{minPrice} - ₹{maxPrice}

                        <span className="ml-1 text-sm font-medium">
                          / {scrapValuation?.unit || 'kg'}
                        </span>

                      </div>

                    </div>

                    <span className="text-3xl">
                      📈
                    </span>

                  </div>

                  {safetyTips.length > 0 && (
                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                      <p className="text-xs font-bold text-slate-700">
                        ✨ How to Maximize Buyback Value
                      </p>

                      <ul className="space-y-1 text-xs text-slate-600">

                        {safetyTips.map((tip, index) => (
                          <li key={index}>
                            ✓ {tip}
                          </li>
                        ))}

                      </ul>

                    </div>
                  )}

                </div>
              )}

              {/* =================================================
                  CALCULATOR TAB
              ================================================== */}
              {activeTab === 'calculator' && (
                <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="text-base font-bold text-slate-900">
                        Scrap Valuation & Earnings Calculator
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Adjust the quantity to estimate potential
                        scrap revenue.
                      </p>

                    </div>

                    <span className="text-2xl">
                      🧮
                    </span>

                  </div>

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label className="text-xs font-bold text-slate-700">
                        Quantity (
                        {classification?.primaryMaterial ||
                          'Waste'}
                        )
                      </label>

                      <span className="rounded-xl bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                        {calcWeightKg} KG
                      </span>

                    </div>

                    <input
                      type="range"
                      min="1"
                      max="500"
                      step="1"
                      value={calcWeightKg}
                      onChange={(event) =>
                        setCalcWeightKg(
                          Number(event.target.value)
                        )
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600"
                    />

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                      <span className="text-[11px] font-bold uppercase text-emerald-800">
                        Estimated Revenue
                      </span>

                      <p className="mt-1 text-2xl font-black text-emerald-950">
                        ₹{totalEstimatedEarnings.toLocaleString(
                          'en-IN'
                        )}
                      </p>

                      <span className="text-[10px] text-emerald-700">
                        @ ₹{avgPrice}/kg average estimate
                      </span>

                    </div>

                    <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">

                      <span className="text-[11px] font-bold uppercase text-teal-800">
                        Carbon Offset
                      </span>

                      <p className="mt-1 text-2xl font-black text-teal-950">
                        {totalCo2Offset} kg
                      </p>

                      <span className="text-[10px] text-teal-700">
                        estimated CO₂e avoided
                      </span>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  MARKETPLACE
              ================================================== */}
              {wow?.quickListing && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-2xl md:flex-row">

                  <div>

                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950">
                      Instant Monetization
                    </span>

                    <h4 className="mt-1 text-base font-bold text-white">
                      Ready to sell this on CleanNect Marketplace?
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Auto-fill listing title, category,
                      description and estimated price.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleCreateListingFromAnalysis}
                    className="flex-shrink-0 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg transition hover:bg-emerald-400 active:scale-95"
                  >
                    🛍️ Publish Listing Now →
                  </button>

                </div>
              )}

            </div>

          ) : (

            /* =================================================
               EMPTY STATE
            ================================================== */
            <div className="flex min-h-[480px] flex-col items-center justify-center space-y-3 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-400">
                ✨
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Ready for AI Waste Inspection
              </h3>

              <p className="max-w-sm text-xs text-slate-400">
                Upload a photo or choose a sample waste material
                to generate Wealth out of Waste recommendations.
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
} 