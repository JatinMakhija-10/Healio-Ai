
<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Healio.AI - Complete Technical &amp; Business Specification</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tiempos+Text:wght@400;700&amp;family=Inter:wght@300;400;500;600&amp;display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        .font-tiempos { font-family: 'Tiempos Text', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .hero-gradient { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
        .text-teal { color: #0d9488; }
        .bg-teal { background-color: #0d9488; }
        .border-teal { border-color: #0d9488; }
        .hover-teal:hover { background-color: #0f766e; }
        .sidebar-fixed { position: fixed; top: 0; left: 0; height: 100vh; width: 280px; z-index: 40; }
        .main-content { margin-left: 280px; }
        .diagram-container { background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); }
        
        /* Mermaid diagram styling */
        .mermaid-container {
            display: flex;
            justify-content: center;
            min-height: 300px;
            max-height: 800px;
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
        }
        
        .mermaid-container .mermaid {
            width: 100%;
            max-width: 100%;
            height: 100%;
            cursor: grab;
            transition: transform 0.3s ease;
            transform-origin: center center;
            display: flex;
            justify-content: center;
            align-items: center;
            touch-action: none; /* 防止触摸设备上的默认行为 */
            -webkit-user-select: none; /* 防止文本选择 */
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        .mermaid-container .mermaid svg {
            max-width: 100%;
            height: 100%;
            display: block;
            margin: 0 auto;
        }
        
        .mermaid-container .mermaid:active {
            cursor: grabbing;
        }
        
        .mermaid-container.zoomed .mermaid {
            height: 100%;
            width: 100%;
            cursor: grab;
        }
        
        .mermaid-controls {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            gap: 10px;
            z-index: 20;
            background: rgba(255, 255, 255, 0.95);
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .mermaid-control-btn {
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #374151;
            font-size: 14px;
            min-width: 36px;
            height: 36px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .mermaid-control-btn:hover {
            background: #f8fafc;
            border-color: #3b82f6;
            color: #3b82f6;
            transform: translateY(-1px);
        }
        
        .mermaid-control-btn:active {
            transform: scale(0.95);
        }
        
        /* Enhanced text contrast and styling for mermaid */
        .mermaid-container .mermaid svg {
            font-family: 'Inter', sans-serif !important;
            font-size: 14px !important;
        }
        
        /* Improve text readability and contrast */
        .mermaid .node rect,
        .mermaid .node circle,
        .mermaid .node ellipse,
        .mermaid .node polygon {
            stroke: #374151 !important;
            stroke-width: 2px !important;
        }
        
        .mermaid .node .label {
            color: #1f2937 !important;
            font-weight: 500 !important;
            font-size: 13px !important;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
        }
        
        .mermaid .edgePath .path {
            stroke: #4b5563 !important;
            stroke-width: 2px !important;
        }
        
        .mermaid .edgeLabel {
            background-color: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid #d1d5db !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            color: #374151 !important;
            font-weight: 500 !important;
        }
        
        /* Enhanced node styling with better contrast */
        .mermaid .node[class*="default"] rect {
            fill: #f8fafc !important;
            stroke: #475569 !important;
        }
        
        .mermaid .node[class*="default"] .label {
            color: #1e293b !important;
            font-weight: 600 !important;
        }
        
        /* Color scheme with high contrast */
        .mermaid .node[id*="A"] rect { fill: #dbeafe !important; stroke: #1d4ed8 !important; }
        .mermaid .node[id*="A"] .label { color: #1e3a8a !important; }
        
        .mermaid .node[id*="B"] rect { fill: #f3e8ff !important; stroke: #7c3aed !important; }
        .mermaid .node[id*="B"] .label { color: #581c87 !important; }
        
        .mermaid .node[id*="C"] rect { fill: #dcfce7 !important; stroke: #16a34a !important; }
        .mermaid .node[id*="C"] .label { color: #14532d !important; }
        
        .mermaid .node[id*="D"] rect { fill: #fef3c7 !important; stroke: #d97706 !important; }
        .mermaid .node[id*="D"] .label { color: #92400e !important; }
        
        .mermaid .node[id*="E"] rect { fill: #fce7f3 !important; stroke: #be185d !important; }
        .mermaid .node[id*="E"] .label { color: #831843 !important; }
        
        .mermaid .node[id*="F"] rect { fill: #ecfdf5 !important; stroke: #059669 !important; }
        .mermaid .node[id*="F"] .label { color: #064e3b !important; }
        
        .mermaid .node[id*="G"] rect { fill: #f0f9ff !important; stroke: #0284c7 !important; }
        .mermaid .node[id*="G"] .label { color: #0c4a6e !important; }
        
        .mermaid .node[id*="H"] rect { fill: #fef7cd !important; stroke: #ca8a04 !important; }
        .mermaid .node[id*="H"] .label { color: #78350f !important; }
        
        /* Responsive adjustments for mermaid controls */
        @media (max-width: 1024px) {
            .mermaid-control-btn:not(.reset-zoom) {
                display: none;
            }
            .mermaid-controls {
                top: auto;
                bottom: 15px;
                right: 15px;
            }
        }
    </style>
  <base target="_blank">
</head>

  <body class="font-inter bg-slate-50 text-slate-800 overflow-x-hidden">

    <!-- Fixed Table of Contents -->
    <nav class="sidebar-fixed bg-white border-r border-slate-200 overflow-y-auto">
      <div class="p-6">
        <h3 class="font-tiempos text-lg font-bold text-slate-900 mb-4">Table of Contents</h3>
        <ul class="space-y-2 text-sm">
          <li>
            <a href="#1-executive-summary--strategic-positioning" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">1. Executive Summary</a>
          </li>
          <li>
            <a href="#2-core-ai-engine-advancements" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">2. Core AI Engine</a>
          </li>
          <li>
            <a href="#3-expanded-traditional-medicine-systems" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">3. Expanded Systems</a>
          </li>
          <li>
            <a href="#4-technical-architecture-enhancements" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">4. Technical Architecture</a>
          </li>
          <li>
            <a href="#5-user-experience--workflow-enhancements" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">5. User Experience</a>
          </li>
          <li>
            <a href="#6-compliance--safety-framework" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">6. Compliance &amp; Safety</a>
          </li>
          <li>
            <a href="#7-revenue-model-expansion" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">7. Revenue Model</a>
          </li>
          <li>
            <a href="#8-implementation-roadmap" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">8. Implementation Roadmap</a>
          </li>
          <li>
            <a href="#9-research--validation-priorities" class="block py-1 px-2 text-slate-600 hover:text-teal hover:bg-slate-50 rounded">9. Research Priorities</a>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content min-h-screen">

      <!-- Hero Section -->
      <section class="hero-gradient px-8 py-16">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

            <!-- Title Block -->
            <div class="lg:col-span-2">
              <h1 class="font-tiempos text-5xl font-bold text-slate-900 mb-6 leading-tight">
                <em class="text-teal">Healio.AI</em>
                <br/>
                Enhanced Technical &amp; Business Specification
              </h1>
              <p class="text-xl text-slate-700 mb-8 leading-relaxed">
                Evolving from an Ayurveda-centric platform to a multi-traditional-medicine ecosystem,
                uniquely bridging modern clinical precision with WHO-standardized ancient healing systems.
              </p>
              <div class="flex flex-wrap gap-4">
                <span class="bg-teal text-white px-4 py-2 rounded-full text-sm font-medium">
                  <i class="fas fa-brain mr-2"></i>Bayesian AI Engine
                </span>
                <span class="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium">
                  <i class="fas fa-leaf mr-2"></i>WHO ICD-11 TM2
                </span>
                <span class="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  <i class="fas fa-globe mr-2"></i>6+ Traditions
                </span>
              </div>
            </div>

            <!-- Visual Element -->
            <div class="lg:col-span-1">
              <div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
                <img src="https://kimi-web-img.moonshot.cn/img/placeholder-0620/%E5%9B%BE%E7%89%8711.png" alt="Traditional medicine practitioner using modern AI healthcare platform" class="w-full rounded-lg shadow-lg" size="medium" aspect="wide" style="photo" query="AI healthcare platform traditional medicine" referrerpolicy="no-referrer" data-modified="1" data-score="0.00"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Highlights Grid -->
      <section class="px-8 py-12 bg-white">
        <div class="max-w-6xl mx-auto">
          <h2 class="font-tiempos text-3xl font-bold text-slate-900 mb-12 text-center">Strategic Enhancements</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div class="bg-teal text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-shield-alt text-xl"></i>
              </div>
              <h3 class="font-tiempos text-xl font-bold text-slate-900 mb-3">
                Sub-100ms Emergency Detection
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Expanded to 50+ life-threatening patterns across all traditional medicine systems,
                maintaining <strong>0.50ms actual performance</strong> while adding cultural pattern recognition.
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div class="bg-slate-800 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-book-medical text-xl"></i>
              </div>
              <h3 class="font-tiempos text-xl font-bold text-slate-900 mb-3">
                WHO ICD-11 Compliance
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Full integration with WHO&#39;s Traditional Medicine Module (TM2),
                enabling <strong>insurance reimbursement</strong> and clinical research standards.
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div class="bg-amber-600 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-network-wired text-xl"></i>
              </div>
              <h3 class="font-tiempos text-xl font-bold text-slate-900 mb-3">
                Multi-System Integration
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Unified Bayesian framework connecting <strong>6+ traditional systems</strong>
                while preserving each tradition&#39;s epistemological integrity.
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div class="bg-teal text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-user-check text-xl"></i>
              </div>
              <h3 class="font-tiempos text-xl font-bold text-slate-900 mb-3">
                50+ Factor Prakriti Assessment
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Enhanced constitutional analysis with uncertainty quantification
                and <strong>cross-system constitutional mapping</strong>.
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div class="bg-slate-800 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-chart-line text-xl"></i>
              </div>
              <h3 class="font-tiempos text-xl font-bold text-slate-900 mb-3">
                AI-Traditional Medicine Fusion
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Computational assistance that preserves <strong>epistemological fidelity</strong>
                across diverse medical paradigms.
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div class="bg-amber-600 text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-globe-americas text-xl"></i>
              </div>
              <h3 class="font-tiempos text-xl font-bold text-slate-900 mb-3">
                Global Practitioner Network
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Cross-system referral pathways and <strong>verified credentials</strong>
                across multiple traditional medicine traditions.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- Content Sections -->
      <div class="max-w-6xl mx-auto px-8 py-12 space-y-16">

        <!-- Section 1: Executive Summary -->
        <section id="1-executive-summary--strategic-positioning">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">1. Executive Summary &amp; Strategic Positioning</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">1.1 Platform Vision Refinement</h3>

            <div class="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
              <p class="font-medium text-blue-900 mb-2">Mission Evolution</p>
              <p class="text-blue-800">
                Healio.AI&#39;s mission expands from &#34;democratizing access to high-quality, personalized healthcare
                that treats the individual, not just the symptom&#34; to explicitly encompassing its role as the
                <strong>world&#39;s first universal translator between medical paradigms</strong>.
              </p>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">1.1.1 Market Opportunity</h4>
            <p class="text-slate-700 mb-6">
              By 2026, the global traditional medicine market exceeds <strong>$120 billion</strong>, with India&#39;s AYUSH sector alone valued at
              <strong>₹1,00,000 Crore ($12B+)</strong>
              <sup>
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12602521/" class="text-teal hover:underline">[87]</a>
              </sup>.
              Healio.AI is uniquely positioned to capture this market through technical capabilities that competitors cannot easily replicate:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div class="bg-slate-50 p-6 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Technical Differentiators</h5>
                <ul class="text-sm text-slate-700 space-y-2">
                  <li>• <strong>Sub-100ms emergency detection</strong> across all systems</li>
                  <li>• <strong>Bayesian probabilistic inference</strong> with uncertainty quantification</li>
                  <li>• <strong>Cross-system diagnostic fusion</strong> preserving epistemological fidelity</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-6 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Market Advantages</h5>
                <ul class="text-sm text-slate-700 space-y-2">
                  <li>• <strong>WHO ICD-11 TM2 compliance</strong> for reimbursement</li>
                  <li>• <strong>Standardized nomenclature</strong> for 361 acupuncture points</li>
                  <li>• <strong>Verified practitioner networks</strong> across multiple systems</li>
                </ul>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">1.1.2 Ecosystem Architecture</h4>

            <div class="diagram-container">
              <div class="mermaid-container">
                <div class="mermaid-controls">
                  <button class="mermaid-control-btn zoom-in" title="放大">
                    <i class="fas fa-search-plus"></i>
                  </button>
                  <button class="mermaid-control-btn zoom-out" title="缩小">
                    <i class="fas fa-search-minus"></i>
                  </button>
                  <button class="mermaid-control-btn reset-zoom" title="重置">
                    <i class="fas fa-expand-arrows-alt"></i>
                  </button>
                  <button class="mermaid-control-btn fullscreen" title="全屏查看">
                    <i class="fas fa-expand"></i>
                  </button>
                </div>
                <div class="mermaid">
                  graph TB
                  A[&#34;User Interface Layer&#34;] --&gt; B[&#34;Unified AI Core&#34;]
                  B --&gt; C[&#34;Traditional Medicine Intelligence&#34;]
                  C --&gt; D[&#34;Knowledge &amp; Ontology&#34;]
                  D --&gt; E[&#34;Infrastructure Layer&#34;]

                  A1[&#34;Patient Dashboard&#34;] --&gt; A
                  A2[&#34;Doctor Dashboard&#34;] --&gt; A
                  A3[&#34;TCM Practitioner Portal&#34;] --&gt; A
                  A4[&#34;Siddha Practitioner Portal&#34;] --&gt; A
                  A5[&#34;Yoga Therapist Portal&#34;] --&gt; A
                  A6[&#34;Admin Dashboard&#34;] --&gt; A

                  B1[&#34;Multi-System Inference&#34;] --&gt; B
                  B2[&#34;Cross-System Pattern Recognition&#34;] --&gt; B
                  B3[&#34;Information Gain Optimization&#34;] --&gt; B
                  B4[&#34;Emergency Detection Subsystem&#34;] --&gt; B

                  C1[&#34;Ayurveda: Prakriti/Vikriti Engines&#34;] --&gt; C
                  C2[&#34;TCM: Syndrome Differentiation&#34;] --&gt; C
                  C3[&#34;Siddha: Varma Points&#34;] --&gt; C
                  C4[&#34;Unani: Mizaj Assessment&#34;] --&gt; C
                  C5[&#34;Yoga: Asana-Pranayama-Meditation&#34;] --&gt; C

                  D1[&#34;ICD-11 TM1/TM2&#34;] --&gt; D
                  D2[&#34;WHO Acupuncture Nomenclature&#34;] --&gt; D
                  D3[&#34;NAMASTE Portal&#34;] --&gt; D
                  D4[&#34;Dravyaguna Database&#34;] --&gt; D
                  D5[&#34;Cross-System Symptom Ontology&#34;] --&gt; D

                  E1[&#34;Supabase PostgreSQL 16&#34;] --&gt; E
                  E2[&#34;Edge Functions Deno&#34;] --&gt; E
                  E3[&#34;Redis Caching&#34;] --&gt; E
                  E4[&#34;GPU Neural Networks&#34;] --&gt; E
                </div>
              </div>
              <div class="mt-4 text-sm text-slate-600 text-center">
                Enhanced Healio.AI Ecosystem Architecture - Multi-layered system integrating traditional medicine
                practitioner portals while preserving core technical advantages
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: Core AI Engine -->
        <section id="2-core-ai-engine-advancements">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">2. Core AI Engine Advancements</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">2.1 Bayesian Diagnosis Engine Optimization</h3>

            <div class="bg-slate-50 p-6 rounded-lg mb-8">
              <h4 class="font-semibold text-slate-900 mb-4">Multi-Stage Inference Pipeline</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-slate-200">
                      <th class="text-left py-2 font-medium">Phase</th>
                      <th class="text-left py-2 font-medium">Function</th>
                      <th class="text-left py-2 font-medium">Duration Target</th>
                      <th class="text-left py-2 font-medium">Key Enhancement</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-700">
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">1. Multi-System Intake</td>
                      <td class="py-2">Collect structured data across all enabled systems</td>
                      <td class="py-2">3-4 min</td>
                      <td class="py-2">Dynamic form adaptation based on preferences</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">2. Emergency Detection</td>
                      <td class="py-2">Hierarchical red flag scanning</td>
                      <td class="py-2 text-teal font-bold">&lt;100ms</td>
                      <td class="py-2">Expanded to 50+ patterns including traditional medicine emergencies</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">3. Cross-System Standardization</td>
                      <td class="py-2">Map symptoms to unified ontology</td>
                      <td class="py-2">&lt;50ms</td>
                      <td class="py-2">Enables parallel evaluation across diagnostic frameworks</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">4. Multi-System Bayesian Inference</td>
                      <td class="py-2">Compute P(Condition|Evidence) for all systems</td>
                      <td class="py-2">&lt;500ms</td>
                      <td class="py-2">Coupled probability distributions with &#34;bridge conditions&#34;</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">5. Information Gain Optimization</td>
                      <td class="py-2">Select maximally informative next question</td>
                      <td class="py-2">&lt;100ms</td>
                      <td class="py-2">Cross-system discriminative value; cultural adaptation</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">6. Tradition-Specific Reasoning</td>
                      <td class="py-2">Apply system-specific diagnostic rules</td>
                      <td class="py-2">&lt;200ms</td>
                      <td class="py-2">Syndrome differentiation, humor assessment, pattern recognition</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 font-medium">7. Cross-System Integration</td>
                      <td class="py-2">Resolve conflicts, quantify agreement</td>
                      <td class="py-2">&lt;100ms</td>
                      <td class="py-2">Hierarchical preference, evidence weighting, practitioner availability</td>
                    </tr>
                    <tr>
                      <td class="py-2 font-medium">8. Personalized Presentation</td>
                      <td class="py-2">Format output per user preferences</td>
                      <td class="py-2">&lt;50ms</td>
                      <td class="py-2">Confidence calibration, reasoning traces, appropriate uncertainty communication</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">2.1.2 Emergency Detection Sub-100ms Architecture</h4>

            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <p class="font-medium text-yellow-900 mb-2">Performance Achievement</p>
              <p class="text-yellow-800">
                The emergency detection subsystem&#39;s <strong>0.50ms performance</strong> (vs. &lt;200ms target)
                creates substantial headroom for expanded pattern recognition while maintaining safety-critical responsiveness.
                <sup>
                  <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11245652/" class="text-teal hover:underline">[17]</a>
                </sup>
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h5 class="font-semibold text-red-900 mb-2">Level 1: Immediate Life Threat</h5>
                <p class="text-sm text-red-700"><strong>0.50ms</strong> | 15 patterns</p>
                <p class="text-xs text-red-600 mt-1">Cardiac arrest, anaphylaxis, severe hemorrhage, stroke (FAST)</p>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h5 class="font-semibold text-orange-900 mb-2">Level 2: Urgent Intervention</h5>
                <p class="text-sm text-orange-700"><strong>5ms</strong> | 25 patterns</p>
                <p class="text-xs text-orange-600 mt-1">MI, sepsis, ectopic pregnancy, acute abdomen</p>
              </div>
              <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 class="font-semibold text-yellow-900 mb-2">Level 3: Critical Traditional</h5>
                <p class="text-sm text-yellow-700"><strong>50ms</strong> | 15 patterns</p>
                <p class="text-xs text-yellow-600 mt-1">TCM &#34;Yang collapse,&#34; Ayurveda &#34;Sannipataja Jwara&#34;</p>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">2.1.3 Information Gain Questioning</h4>

            <div class="bg-slate-100 p-6 rounded-lg mb-6">
              <p class="font-mono text-sm text-slate-700 mb-4">IG(Q) = Σ_s w_s × [H_s(D) - E_s[H_s(D|Q)]] - λ × Burden(Q) + μ × Cultural_Fit(Q)</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <p><strong>w_s:</strong> System weight (user preference)</p>
                  <p><strong>H_s(D):</strong> Entropy of diagnosis distribution</p>
                  <p><strong>E_s[H_s(D|Q)]:</strong> Expected entropy after observing Q</p>
                </div>
                <div>
                  <p><strong>Burden(Q):</strong> User burden (time, invasiveness)</p>
                  <p><strong>Cultural_Fit(Q):</strong> Appropriateness for context</p>
                  <p><strong>λ, μ:</strong> Tuning parameters</p>
                </div>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">2.2 Ayurvedic Intelligence Layer</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">2.2.1 Prakriti Engine: 50+ Factor Assessment</h4>

            <div class="overflow-x-auto mb-8">
              <table class="w-full text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium">Domain</th>
                    <th class="text-left py-2 px-3 font-medium">Factors</th>
                    <th class="text-left py-2 px-3 font-medium">Reliability</th>
                    <th class="text-left py-2 px-3 font-medium">Weight</th>
                  </tr>
                </thead>
                <tbody class="text-slate-700">
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Physical Build (Sharirik)</td>
                    <td class="py-2 px-3">Body frame, weight tendency, muscle development, joint prominence, bone structure, height relative to family</td>
                    <td class="py-2 px-3">0.78</td>
                    <td class="py-2 px-3">High</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Digestion &amp; Metabolism (Agni)</td>
                    <td class="py-2 px-3">Appetite regularity, hunger intensity, digestion speed, post-meal comfort, bowel regularity, stool characteristics, food cravings, metabolic rate</td>
                    <td class="py-2 px-3">0.85</td>
                    <td class="py-2 px-3 text-teal font-bold">Very High</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3">Energy &amp; Sleep (Ojas-Nidra)</td>
                    <td class="py-2 px-3">Sleep duration, quality, daytime energy, exercise tolerance, recovery speed, seasonal variation, dream characteristics</td>
                    <td class="py-2 px-3">0.79</td>
                    <td class="py-2 px-3">High</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">2.2.2 Dosha-Condition Probability Boosting</h4>

            <div class="bg-teal-50 p-6 rounded-lg mb-6">
              <p class="font-medium text-teal-900 mb-4">Enhanced Boosting Model with Uncertainty Quantification</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 class="font-semibold text-teal-800 mb-2">Type 2 Diabetes</h6>
                  <p class="text-sm text-teal-700">Kapha Boost: 1.45 (Strong evidence)</p>
                  <p class="text-xs text-teal-600">Confidence: [1.28, 1.64]</p>
                </div>
                <div>
                  <h6 class="font-semibold text-teal-800 mb-2">GERD/Acid Reflux</h6>
                  <p class="text-sm text-teal-700">Pitta Boost: 1.55 (Moderate evidence)</p>
                  <p class="text-xs text-teal-600">Confidence: [1.28, 1.88]</p>
                </div>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">2.3 Cross-System Diagnostic Integration</h3>

            <div class="diagram-container">
              <div class="mermaid-container">
                <div class="mermaid-controls">
                  <button class="mermaid-control-btn zoom-in" title="放大">
                    <i class="fas fa-search-plus"></i>
                  </button>
                  <button class="mermaid-control-btn zoom-out" title="缩小">
                    <i class="fas fa-search-minus"></i>
                  </button>
                  <button class="mermaid-control-btn reset-zoom" title="重置">
                    <i class="fas fa-expand-arrows-alt"></i>
                  </button>
                  <button class="mermaid-control-btn fullscreen" title="全屏查看">
                    <i class="fas fa-expand"></i>
                  </button>
                </div>
                <div class="mermaid">
                  graph LR
                  A[&#34;Text Input&#34;] --&gt; E[&#34;Multi-Modal Fusion&#34;]
                  B[&#34;Image Input&#34;] --&gt; E
                  C[&#34;Sensor Data&#34;] --&gt; E
                  D[&#34;Audio Input&#34;] --&gt; E

                  E --&gt; F[&#34;Modality-Specific Encoders&#34;]
                  F --&gt; G[&#34;Cross-Modal Attention&#34;]
                  G --&gt; H[&#34;Tradition-Specific Decoders&#34;]

                  H --&gt; I[&#34;Biomedical: Disease Classification&#34;]
                  H --&gt; J[&#34;Ayurveda: Dosha Imbalance&#34;]
                  H --&gt; K[&#34;TCM: Syndrome Pattern&#34;]
                  H --&gt; L[&#34;Siddha: Mukkutram Balance&#34;]
                  H --&gt; M[&#34;Unani: Mizaj Assessment&#34;]

                  I --&gt; N[&#34;Cross-System Integration&#34;]
                  J --&gt; N
                  K --&gt; N
                  L --&gt; N
                  M --&gt; N

                  N --&gt; O[&#34;Unified Output&#34;]
                </div>
              </div>
              <div class="mt-4 text-sm text-slate-600 text-center">
                Multi-Modal Diagnostic Fusion Architecture - Integration of text, image, sensor, and audio inputs
                across multiple traditional medicine systems
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">2.3.1 TCM-AI Diagnostic Methods</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Tongue Diagnosis AI Pipeline</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Image quality assessment &amp; real-time guidance</li>
                  <li>• Automated segmentation (body vs. coating)</li>
                  <li>• Color/texture feature extraction</li>
                  <li>• Syndrome pattern classification (85-94% accuracy)</li>
                  <li>• Attention heatmap for explainability</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Inquiry Optimization</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• <strong>Ten Questions</strong> framework</li>
                  <li>• BERT-based symptom extraction</li>
                  <li>• Branching logic for pattern differentiation</li>
                  <li>• NLP of free-text descriptions</li>
                  <li>• Information gain optimization</li>
                </ul>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">2.3.2 Siddha Envagai Thervu (8-Fold Examination)</h4>

            <div class="bg-amber-50 p-6 rounded-lg mb-6">
              <p class="font-medium text-amber-900 mb-4">Digital Implementation of Traditional Siddha Diagnostics</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="font-semibold text-amber-800 mb-2">Naadi (Pulse)</p>
                  <p class="text-amber-700">Camera PPG; self-palpation guidance</p>
                </div>
                <div>
                  <p class="font-semibold text-amber-800 mb-2">Moothiram (Urine)</p>
                  <p class="text-amber-700">Neerkkuri + Neikuri analysis; dipstick integration</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: Expanded Traditional Medicine Systems -->
        <section id="3-expanded-traditional-medicine-systems">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">3. Expanded Traditional Medicine Systems</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">3.1 AYUSH Deep Integration</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.1.1 Comprehensive Ayurveda Suite</h4>

            <div class="mb-8">
              <h5 class="font-semibold text-slate-900 mb-3">Panchakarma Guidance System</h5>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-slate-100">
                    <tr>
                      <th class="text-left py-2 px-3 font-medium">Therapy</th>
                      <th class="text-left py-2 px-3 font-medium">Indication</th>
                      <th class="text-left py-2 px-3 font-medium">Contraindications</th>
                      <th class="text-left py-2 px-3 font-medium">Platform Role</th>
                    </tr>
                  </thead>
                  <tbody class="text-slate-700">
                    <tr class="border-b border-slate-200">
                      <td class="py-2 px-3 font-medium">Vamana</td>
                      <td class="py-2 px-3">Kapha disorders, respiratory, skin</td>
                      <td class="py-2 px-3">Pregnancy, cardiac disease, hypertension</td>
                      <td class="py-2 px-3 text-red-600 font-medium">Educational + referral only</td>
                    </tr>
                    <tr class="border-b border-slate-200">
                      <td class="py-2 px-3 font-medium">Basti</td>
                      <td class="py-2 px-3">Vata disorders, musculoskeletal, neurological</td>
                      <td class="py-2 px-3">Acute digestive disorders, perianal disease</td>
                      <td class="py-2 px-3 text-red-600 font-medium">Educational + referral only</td>
                    </tr>
                    <tr>
                      <td class="py-2 px-3 font-medium">Nasya</td>
                      <td class="py-2 px-3">Head-neck, sinus, mental, hair disorders</td>
                      <td class="py-2 px-3">Acute respiratory infection, recent nasal surgery</td>
                      <td class="py-2 px-3 text-green-600 font-medium">Self-administration guidance for simple oils</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-green-50 border-l-4 border-green-400 p-6 mb-8">
              <p class="font-medium text-green-900 mb-2">Dinacharya (Daily Routine) Engine</p>
              <p class="text-green-800 text-sm">
                Personalized 24-hour schedules optimized for individual Prakriti, current Vikriti, occupation, and life stage.
                Includes seasonal modifications through Ritucharya integration.
              </p>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.1.2 Yoga: Comprehensive Practice Framework</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-2">Asana Database Structure</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• 500+ postures with metadata</li>
                  <li>• Biomechanics &amp; joint actions</li>
                  <li>• Dosha effects (Vata/Pitta/Kapha)</li>
                  <li>• Therapeutic indications</li>
                  <li>• Sequencing relationships</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-2">Pranayama Progression</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Foundation: Natural breath awareness</li>
                  <li>• Beginner: Nadi Shodhana, Ujjayi</li>
                  <li>• Intermediate: Kapalabhati, Bhastrika</li>
                  <li>• Advanced: Kumbhaka, Bandha integration</li>
                </ul>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.1.3 Siddha: Varma &amp; Mukkutram Systems</h4>

            <div class="bg-amber-50 p-6 rounded-lg mb-6">
              <h5 class="font-semibold text-amber-900 mb-3">108 Varma Points Integration</h5>
              <p class="text-sm text-amber-800 mb-3">
                Complete anatomical mapping with Tamil nomenclature, therapeutic applications,
                and cross-system correspondence to TCM acupuncture points and Ayurvedic marma points.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-amber-700">
                <div>• Thodu Varma (Touch)</div>
                <div>• Padu Varma (Press)</div>
                <div>• Thattu Varma (Strike)</div>
                <div>• Nokku Varma (Gaze)</div>
                <div>• Critical Level Points</div>
                <div>• Major Level Points</div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.1.4 Naturopathy: Five-Element Framework</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h6 class="font-semibold text-green-900 mb-2">Earth (Prithvi)</h6>
                <p class="text-sm text-green-700">Mud therapy, earth baths, grounding</p>
                <p class="text-xs text-green-600 mt-1">Skin conditions, detoxification</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h6 class="font-semibold text-blue-900 mb-2">Water (Jala)</h6>
                <p class="text-sm text-blue-700">Hydrotherapy, spinal baths, steam</p>
                <p class="text-xs text-blue-600 mt-1">Circulation, musculoskeletal pain</p>
              </div>
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h6 class="font-semibold text-red-900 mb-2">Fire (Agni)</h6>
                <p class="text-sm text-red-700">Chromotherapy, sun therapy, thermal</p>
                <p class="text-xs text-red-600 mt-1">Metabolic disorders, depression</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h6 class="font-semibold text-purple-900 mb-2">Air (Vayu)</h6>
                <p class="text-sm text-purple-700">Breathing exercises, air baths</p>
                <p class="text-xs text-purple-600 mt-1">Respiratory conditions, anxiety</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-1 lg:col-span-2">
                <h6 class="font-semibold text-gray-900 mb-2">Ether (Akasha)</h6>
                <p class="text-sm text-gray-700">Fasting, meditation, sound therapy, space clearing</p>
                <p class="text-xs text-gray-600 mt-1">Mental clarity, spiritual development, digestive rest, sensory purification</p>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">3.2 Traditional Chinese Medicine Module</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.2.1 WHO Standard Acupuncture Points</h4>

            <div class="diagram-container">
              <img src="https://kimi-web-img.moonshot.cn/img/i.pinimg.com/a5980e6e79fd5940d6a5cd5e6e95c8f829c844b0.jpg" alt="Traditional Chinese Medicine meridian system diagram" class="w-full rounded-lg shadow-lg" size="large" aspect="wide" color="bw" style="linedrawing" query="TCM meridian system diagram" referrerpolicy="no-referrer" data-modified="1" data-score="0.00"/>
              <div class="mt-4 text-sm text-slate-600 text-center">
                WHO Standard Acupuncture Nomenclature - 361 classical points across 14 primary meridians
                with standardized anatomical locations and therapeutic indications
              </div>
            </div>

            <div class="bg-blue-50 p-6 rounded-lg mb-6">
              <p class="font-medium text-blue-900 mb-2">Key Meridian Examples</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p class="font-semibold">Stomach Meridian (ST)</p>
                  <p>45 points - Gastrointestinal, facial paralysis</p>
                  <p class="text-xs text-blue-600">ST36 (Zusanli): Postoperative nausea, functional dyspepsia</p>
                </div>
                <div>
                  <p class="font-semibold">Liver Meridian (LR)</p>
                  <p>14 points - Liver disorders, menstrual conditions</p>
                  <p class="text-xs text-blue-600">LR3 (Taichong): Liver Qi stagnation, headache</p>
                </div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.2.2 Tongue &amp; Pulse Image AI Analysis</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-2">Tongue Analysis Pipeline</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Image quality assessment: 94% acceptable rate</li>
                  <li>• Segmentation: Dice coefficient &gt;0.92</li>
                  <li>• Color analysis: LAB space feature extraction</li>
                  <li>• Pattern classification: 85-94% accuracy</li>
                  <li>• Attention heatmap for explainability</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-2">Pulse Analysis Development</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Current: Structured self-assessment + HRV</li>
                  <li>• Near-term: Pressure sensor array</li>
                  <li>• Medium-term: PPG + AI enhancement</li>
                  <li>• Long-term: Nadi-Bot smartphone camera</li>
                </ul>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">3.3 Global Traditional Medicine Expansion</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.3.1 Kampo (Japanese Traditional Medicine)</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-2">Standardized Formulations</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Refined extracts vs. raw herbs</li>
                  <li>• Pharmaceutical quality standards</li>
                  <li>• National health insurance reimbursement</li>
                  <li>• Example: TJ-43, TSUMURA products</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-4 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-2">Evidence Base</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Substantial modern RCTs</li>
                  <li>• Example: TJ-107 for atopic dermatitis</li>
                  <li>• Quality control batch testing</li>
                  <li>• Premium positioning opportunity</li>
                </ul>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">3.3.2 Korean Medicine Integration</h4>

            <div class="bg-indigo-50 p-6 rounded-lg mb-6">
              <p class="font-medium text-indigo-900 mb-3">Sasang Constitutional Medicine</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800">
                <div>
                  <p class="font-semibold mb-1">Soyangin (少陽人)</p>
                  <p>Extroverted, active, impatient</p>
                  <p class="text-xs text-indigo-600">Liver, digestive, hypertension tendencies</p>
                </div>
                <div>
                  <p class="font-semibold mb-1">Taeeumin (太陰人)</p>
                  <p>Introverted, patient, methodical</p>
                  <p class="text-xs text-indigo-600">Respiratory, metabolic, obesity tendencies</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Technical Architecture -->
        <section id="4-technical-architecture-enhancements">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">4. Technical Architecture Enhancements</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">4.1 Data Model Evolution</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.1.1 ICD-11 Compliant Condition Coding</h4>

            <div class="bg-slate-100 p-6 rounded-lg mb-6">
              <h5 class="font-semibold text-slate-900 mb-3">Dual Coding Architecture</h5>
              <div class="font-mono text-sm text-slate-700 space-y-2">
                <div class="text-xs text-slate-500">// Primary biomedical coding</div>
                <div>biomedical: { code: &#34;DA90&#34;, title: &#34;Gastro-oesophageal reflux disease&#34;, uri: &#34;http://id.who.int/icd/entity/1234567890&#34; }</div>
                <br/>
                <div class="text-xs text-slate-500">// Traditional medicine coding</div>
                <div>traditional: { system: &#34;ayurveda&#34;, code: &#34;DA90.0&#34;, traditionalName: &#34;Amlapitta&#34;, patternCodes: [&#34;SA00.2&#34;, &#34;SA00.5&#34;] }</div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.1.2 Multi-System Practitioner Network Schema</h4>

            <div class="bg-teal-50 p-6 rounded-lg mb-6">
              <h5 class="font-semibold text-teal-900 mb-3">TraditionalMedicinePractitioner Interface</h5>
              <div class="text-sm text-teal-800 space-y-2">
                <div><strong>certifications:</strong> Array of { system, degree, licenseNumber, verificationStatus }</div>
                <div><strong>specializations:</strong> Array of { system, areas, techniques, advancedCertifications }</div>
                <div><strong>practiceModes:</strong> Enum[&#39;telemedicine&#39;, &#39;audio&#39;, &#39;in-person&#39;]</div>
                <div><strong>aiIntegrationMetrics:</strong> { aiAssistedSessions, aiAgreementRate, aiOverrideRate }</div>
                <div><strong>collaborationNetwork:</strong> Array of practitioner IDs and referral preferences</div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.1.3 Cross-Traditional-Medicine Symptom Ontology</h4>

            <div class="overflow-x-auto mb-8">
              <table class="w-full text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium">Universal Symptom</th>
                    <th class="text-left py-2 px-3 font-medium">Modern Biomedical</th>
                    <th class="text-left py-2 px-3 font-medium">Ayurvedic Interpretation</th>
                    <th class="text-left py-2 px-3 font-medium">TCM Interpretation</th>
                  </tr>
                </thead>
                <tbody class="text-slate-700">
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Fever with afternoon exacerbation</td>
                    <td class="py-2 px-3">Diurnal fever pattern; infectious/inflammatory workup</td>
                    <td class="py-2 px-3">Pitta aggravation; Vishama Jwara</td>
                    <td class="py-2 px-3">Yin Deficiency with Empty Heat; Yangming stage heat</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Burning chest pain after meals</td>
                    <td class="py-2 px-3">GERD; cardiac workup to exclude MI</td>
                    <td class="py-2 px-3">Amlapitta; Pitta in Amashaya</td>
                    <td class="py-2 px-3">Stomach Fire or Liver-Stomach disharmony</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3">Chronic fatigue with heaviness</td>
                    <td class="py-2 px-3">Anemia; hypothyroidism; depression; CFS</td>
                    <td class="py-2 px-3">Kapha imbalance; Ama accumulation</td>
                    <td class="py-2 px-3">Spleen Qi Deficiency with Dampness</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">4.2 API Infrastructure Expansion</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.2.1 TCM Acupuncture Endpoints</h4>

            <div class="bg-slate-800 text-green-400 p-4 rounded-lg mb-6 font-mono text-sm">
              <div class="text-white mb-2">GET /api/tcm/acupuncture/points</div>
              <div class="text-gray-400 text-xs">Query: meridian, indication, location_region, common_only</div>
              <div class="text-gray-400 text-xs">Response: Array of points with metadata, recommendations</div>
              <br/>
              <div class="text-white mb-2">POST /api/tcm/acupuncture/points/recommend</div>
              <div class="text-gray-400 text-xs">Body: diagnosed_patterns, target_symptoms, patient_factors</div>
              <div class="text-gray-400 text-xs">Response: recommended_points, combination_protocol, rationale</div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.2.2 Siddha Varma Assessment API</h4>

            <div class="bg-slate-800 text-green-400 p-4 rounded-lg mb-6 font-mono text-sm">
              <div class="text-white mb-2">POST /api/siddha/varma/assessment</div>
              <div class="text-gray-400 text-xs">Body: pain_location_description, trauma_history, constitutional_factors</div>
              <div class="text-gray-400 text-xs">Response: varma_involvement_assessment, treatment_recommendations, safety_flags</div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.2.3 ICD-11 AYUSH Coding API</h4>

            <div class="bg-slate-800 text-green-400 p-4 rounded-lg mb-6 font-mono text-sm">
              <div class="text-white mb-2">POST /api/icd11/ayush/map</div>
              <div class="text-gray-400 text-xs">Body: traditional_diagnosis { system, name, described_symptoms }</div>
              <div class="text-gray-400 text-xs">Response: icd11_mapping { traditional_code, biomedical_equivalent, post_coordination }</div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">4.3 AI/ML Pipeline Advancements</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.3.1 ACU-Net Architecture</h4>

            <div class="bg-blue-50 p-6 rounded-lg mb-6">
              <p class="font-medium text-blue-900 mb-3">Acupuncture Point Localization Performance</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p class="font-semibold">Key Improvements</p>
                  <ul class="text-xs space-y-1 mt-1">
                    <li>• 30.9% improvement over prior SOTA</li>
                    <li>• 0.282 cm average prediction error</li>
                    <li>• 94.1% mAP bounding boxes</li>
                    <li>• 99.5% mAP point detection</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold">Architecture Components</p>
                  <ul class="text-xs space-y-1 mt-1">
                    <li>• CDRS Module (dilated convolutions)</li>
                    <li>• CSFF Feature Fusion</li>
                    <li>• OKS-Based Loss optimization</li>
                    <li>• Attention mechanisms</li>
                  </ul>
                </div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">4.3.2 Traditional Medicine Text Mining</h4>

            <div class="bg-purple-50 p-6 rounded-lg mb-6">
              <p class="font-medium text-purple-900 mb-3">Knowledge Extraction Pipeline</p>
              <div class="space-y-2 text-sm text-purple-800">
                <div class="flex items-center">
                  <span class="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-3">1</span>
                  <span>Corpus assembly: 10M+ tokens from classical texts, modern research</span>
                </div>
                <div class="flex items-center">
                  <span class="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-3">2</span>
                  <span>Entity recognition: fine-tuned BioBERT with traditional medicine vocabulary</span>
                </div>
                <div class="flex items-center">
                  <span class="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-3">3</span>
                  <span>Relation extraction: graph neural networks + rule-based patterns</span>
                </div>
                <div class="flex items-center">
                  <span class="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-3">4</span>
                  <span>Knowledge integration: conflict resolution + provenance tracking</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 5: User Experience -->
        <section id="5-user-experience--workflow-enhancements">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">5. User Experience &amp; Workflow Enhancements</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">5.1 Patient Journey Optimization</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">5.1.1 Enhanced Preference Configuration</h4>

            <div class="bg-slate-100 p-6 rounded-lg mb-8">
              <h5 class="font-semibold text-slate-900 mb-4">Multi-System Preference Toggle</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
                <div>
                  <p class="font-semibold mb-2">Primary Diagnostic Approach</p>
                  <div class="space-y-1">
                    <div>• Intelligent Multi-System (default)</div>
                    <div>• Modern Medicine Priority</div>
                    <div>• Ayurveda &amp; Yoga</div>
                    <div>• Traditional Chinese Medicine</div>
                    <div>• Siddha Medicine</div>
                    <div>• Unani Medicine</div>
                    <div>• Naturopathy</div>
                    <div>• Homeopathy</div>
                  </div>
                </div>
                <div>
                  <p class="font-semibold mb-2">Display &amp; Interaction Preferences</p>
                  <div class="space-y-1">
                    <div>• Show technical terminology</div>
                    <div>• Explain traditional concepts</div>
                    <div>• Display confidence scores</div>
                    <div>• Show system agreement/disagreement</div>
                    <div>• Prefer visual explanations</div>
                    <div>• Audio narration</div>
                  </div>
                </div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">5.1.2 Visual Body Map Expansion</h4>

            <div class="diagram-container">
              <img src="https://kimi-web-img.moonshot.cn/img/placeholder-0620/图片1.png" alt="Human body diagram with acupressure points, marma points, and meridians" class="w-full rounded-lg shadow-lg" size="medium" aspect="tall" color="bw" style="linedrawing" query="acupressure points marma points meridians on human body" referrerpolicy="no-referrer" data-modified="1"/>
              <div class="mt-4 text-sm text-slate-600 text-center">
                Interactive Multi-Layer Body Map - Biomedical, TCM meridians, Ayurvedic marma points,
                Siddha Varma points, with symptom reporting and AI suggestions
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h6 class="font-semibold text-red-900 mb-2">Biomedical Layer</h6>
                <p class="text-xs text-red-700">Pain referral patterns, dermatomes, trigger points</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h6 class="font-semibold text-blue-900 mb-2">TCM Meridians</h6>
                <p class="text-xs text-blue-700">14 primary meridians, 361 acupuncture points</p>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h6 class="font-semibold text-orange-900 mb-2">Ayurveda Marma</h6>
                <p class="text-xs text-orange-700">107 vital points, chakra locations</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h6 class="font-semibold text-purple-900 mb-2">Siddha Varma</h6>
                <p class="text-xs text-purple-700">108 vital points with Tamil nomenclature</p>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">5.1.3 Personalized Treatment Pathway Generation</h4>

            <div class="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg mb-8">
              <h5 class="font-semibold text-slate-900 mb-4">Example: Tension Headache with Stress-Related Digestive Symptoms</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
                <div>
                  <p class="font-semibold text-red-700 mb-2">Immediate Relief (0-24h)</p>
                  <ul class="space-y-1 text-xs">
                    <li>• LI4, LR3 acupressure</li>
                    <li>• Chamomile-Peppermint tea</li>
                    <li>• Gentle forward bends</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold text-orange-700 mb-2">Short-Term (1-2 weeks)</p>
                  <ul class="space-y-1 text-xs">
                    <li>• TCM acupuncturist referral</li>
                    <li>• Vata-pacifying diet</li>
                    <li>• Nadi Shodhana pranayama</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold text-green-700 mb-2">Long-Term Prevention</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Seasonal routine adjustment</li>
                    <li>• Weekly self-massage</li>
                    <li>• Stress management</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">5.2 Practitioner Interface Upgrades</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">5.2.1 Cross-System Differential Diagnosis Explorer</h4>

            <div class="bg-blue-50 p-6 rounded-lg mb-6">
              <h5 class="font-semibold text-blue-900 mb-3">&#34;The Sandbox&#34; - Interactive Diagnostic Reasoning</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p class="font-semibold mb-2">Core Features</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Symptom toggle panel</li>
                    <li>• Real-time probability shifts</li>
                    <li>• Cross-system comparison</li>
                    <li>• What-if exploration</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold mb-2">Advanced Capabilities</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Treatment simulation</li>
                    <li>• Evidence review</li>
                    <li>• Case save/share</li>
                    <li>• Anonymized case library</li>
                  </ul>
                </div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">5.2.2 AI-Assisted SOAP Note Generation</h4>

            <div class="bg-slate-100 p-6 rounded-lg mb-6">
              <h5 class="font-semibold text-slate-900 mb-3">TCM SOAP Note Format</h5>
              <div class="font-mono text-xs text-slate-700 space-y-2">
                <div class="text-white bg-slate-700 p-2 rounded">主诉 SUBJECTIVE (Zhu Su)</div>
                <div class="p-2 border-l-2 border-slate-400">Chief Complaint + TCM-relevant factors extraction</div>
                <div class="text-white bg-slate-700 p-2 rounded">客观 OBJECTIVE (Ke Guan)</div>
                <div class="p-2 border-l-2 border-slate-400">舌象 Tongue + 脉象 Pulse analysis with AI enhancement</div>
                <div class="text-white bg-slate-700 p-2 rounded">辨证 ASSESSMENT (Bian Zheng)</div>
                <div class="p-2 border-l-2 border-slate-400">Pattern Differentiation with confidence scoring</div>
                <div class="text-white bg-slate-700 p-2 rounded">治疗计划 TREATMENT PLAN (Zhi Liao Ji Hua)</div>
                <div class="p-2 border-l-2 border-slate-400">Acupuncture + Herbs + Other recommendations</div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">5.2.3 Integrated Referral Network</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h6 class="font-semibold text-green-900 mb-2">Convergent Diagnosis</h6>
                <p class="text-xs text-green-700">All systems agree → optimal system referral</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h6 class="font-semibold text-blue-900 mb-2">Multimodal Approach</h6>
                <p class="text-xs text-blue-700">Integrated care with patient choice</p>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h6 class="font-semibold text-orange-900 mb-2">Divergent Uncertainty</h6>
                <p class="text-xs text-orange-700">Options with uncertainty explanation</p>
              </div>
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h6 class="font-semibold text-red-900 mb-2">High Stakes</h6>
                <p class="text-xs text-red-700">Biomedical evaluation first, safety priority</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 6: Compliance &amp; Safety -->
        <section id="6-compliance--safety-framework">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">6. Compliance &amp; Safety Framework</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">6.1 Regulatory Alignment</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">6.1.1 AYUSH Ministry Digital Health Standards</h4>

            <div class="overflow-x-auto mb-8">
              <table class="w-full text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium">Standard</th>
                    <th class="text-left py-2 px-3 font-medium">Requirement</th>
                    <th class="text-left py-2 px-3 font-medium">Implementation</th>
                    <th class="text-left py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody class="text-slate-700">
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">NAMASTE Portal Integration</td>
                    <td class="py-2 px-3">Standardized terminology for ASU conditions</td>
                    <td class="py-2 px-3">Full API integration; 4,500+ terms mapped</td>
                    <td class="py-2 px-3 text-green-600 font-bold">✅ Implemented</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Practitioner Verification</td>
                    <td class="py-2 px-3">BAMS/BSMS/BUMS registration validation</td>
                    <td class="py-2 px-3">State AYUSH council integration</td>
                    <td class="py-2 px-3 text-green-600 font-bold">✅ Implemented</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Adverse Event Reporting</td>
                    <td class="py-2 px-3">Mandatory reporting to Pharmacovigilance</td>
                    <td class="py-2 px-3">In-platform reporting workflow</td>
                    <td class="py-2 px-3 text-yellow-600 font-bold">🟡 In Development</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 font-medium">Quality Standards</td>
                    <td class="py-2 px-3">Good Clinical Practice for AYUSH research</td>
                    <td class="py-2 px-3">Protocol templates, ethics review</td>
                    <td class="py-2 px-3 text-red-600 font-bold">🔴 Planned</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">6.1.2 WHO Traditional Medicine Strategy 2025-2034</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h5 class="font-semibold text-blue-900 mb-2">Strategic Objectives</h5>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>• Build evidence base</li>
                  <li>• Promote universal health coverage</li>
                  <li>• Promote safe and effective use</li>
                  <li>• Respect cultural heritage</li>
                </ul>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <h5 class="font-semibold text-blue-900 mb-2">Healio.AI Contribution</h5>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>• Real-world evidence generation</li>
                  <li>• Insurance coding enablement</li>
                  <li>• Practitioner training integration</li>
                  <li>• Knowledge attribution</li>
                </ul>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">6.1.3 FDA 510(k) Pathway Preparation</h4>

            <div class="bg-orange-50 border-l-4 border-orange-400 p-6 mb-8">
              <p class="font-medium text-orange-900 mb-2">Device Classification</p>
              <p class="text-orange-800 text-sm">
                Software as Medical Device (SaMD) for diagnostic support; Class II anticipated.
                Clinical validation study planned: 12-month prospective diagnostic accuracy vs. specialist practitioners.
              </p>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">6.2 Safety Protocols</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">6.2.1 Herb-Drug Interaction Checking</h4>

            <div class="overflow-x-auto mb-8">
              <table class="w-full text-sm">
                <thead class="bg-red-50">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium">Interaction Type</th>
                    <th class="text-left py-2 px-3 font-medium">Examples</th>
                    <th class="text-left py-2 px-3 font-medium">Alert Level</th>
                  </tr>
                </thead>
                <tbody class="text-slate-700">
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Pharmacokinetic</td>
                    <td class="py-2 px-3">St. John&#39;s Wort + Oral contraceptives</td>
                    <td class="py-2 px-3 text-red-600 font-bold">🔴 Contraindicated</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Pharmacodynamic</td>
                    <td class="py-2 px-3">Ginkgo + Warfarin → bleeding risk</td>
                    <td class="py-2 px-3 text-red-600 font-bold">🔴 Contraindicated</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3">Additive toxicity</td>
                    <td class="py-2 px-3">Kava + Paracetamol → liver injury</td>
                    <td class="py-2 px-3 text-red-600 font-bold">🔴 Contraindicated</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3">Therapeutic duplication</td>
                    <td class="py-2 px-3">Ashwagandha + Benzodiazepines</td>
                    <td class="py-2 px-3 text-yellow-600 font-bold">🟡 Caution</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">6.2.2 Contraindication Flags</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h6 class="font-semibold text-pink-900 mb-2">Pregnancy</h6>
                <p class="text-xs text-pink-700">TCM: LI4, SP6 contraindicated</p>
                <p class="text-xs text-pink-700">Ayurveda: Panchakarma avoided</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h6 class="font-semibold text-blue-900 mb-2">Lactation</h6>
                <p class="text-xs text-blue-700">Herb excretion in milk variable</p>
                <p class="text-xs text-blue-700">Infant risk stratification</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h6 class="font-semibold text-green-900 mb-2">Pediatrics</h6>
                <p class="text-xs text-green-700">Weight-based dosing</p>
                <p class="text-xs text-green-700">Guardian consent workflow</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h6 class="font-semibold text-purple-900 mb-2">Elderly</h6>
                <p class="text-xs text-purple-700">Polypharmacy review</p>
                <p class="text-xs text-purple-700">Functional assessment</p>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">6.2.3 Emergency Override Protocol</h4>

            <div class="bg-red-100 border border-red-300 p-6 rounded-lg mb-6">
              <h5 class="font-semibold text-red-900 mb-3">Universal Safety Principle</h5>
              <p class="text-red-800 text-sm mb-4">
                <strong>Traditional medicine recommendations NEVER bypass emergency detection or delay appropriate urgent care.</strong>
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-red-700">
                <div>
                  <p class="font-semibold mb-1">Cardiac Emergency</p>
                  <p>TCM &#34;Heart pain with cold sweat&#34; → Immediate EMS</p>
                </div>
                <div>
                  <p class="font-semibold mb-1">Stroke</p>
                  <p>TCM &#34;Zhong Feng&#34; with facial deviation → Emergency protocol</p>
                </div>
                <div>
                  <p class="font-semibold mb-1">Severe Infection</p>
                  <p>Ayurveda &#34;Sannipataja Jwara&#34; → Urgent evaluation</p>
                </div>
                <div>
                  <p class="font-semibold mb-1">Psychiatric Crisis</p>
                  <p>Any system with suicidal ideation → Crisis intervention</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 7: Revenue Model -->
        <section id="7-revenue-model-expansion">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">7. Revenue Model Expansion</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">7.1 New Revenue Streams</h3>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">7.1.1 TCM Practitioner Marketplace</h4>

            <div class="bg-emerald-50 p-6 rounded-lg mb-8">
              <h5 class="font-semibold text-emerald-900 mb-4">Revenue Projections (Year 3)</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-emerald-800">
                <div>
                  <p class="font-semibold">TCM Acupuncture</p>
                  <p>50,000 consultations @ $80</p>
                  <p class="text-emerald-600 font-bold">$800,000 revenue</p>
                </div>
                <div>
                  <p class="font-semibold">Herbal Prescriptions</p>
                  <p>30,000 prescriptions @ $60</p>
                  <p class="text-emerald-600 font-bold">$270,000 revenue</p>
                </div>
                <div>
                  <p class="font-semibold">Specialist Procedures</p>
                  <p>10,000 procedures @ $50</p>
                  <p class="text-emerald-600 font-bold">$90,000 revenue</p>
                </div>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">7.1.2 Acupuncture Point Diagnostic API</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h6 class="font-semibold text-blue-900 mb-2">Research Tier</h6>
                <p class="text-sm text-blue-700">$5,000/year</p>
                <p class="text-xs text-blue-600 mt-1">Point database, basic localization</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h6 class="font-semibold text-green-900 mb-2">Clinical Tier</h6>
                <p class="text-sm text-green-700">$25,000/year</p>
                <p class="text-xs text-green-600 mt-1">Full API, diagnostic integration</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h6 class="font-semibold text-purple-900 mb-2">Enterprise Tier</h6>
                <p class="text-sm text-purple-700">$100,000+/year</p>
                <p class="text-xs text-purple-600 mt-1">Custom, white-label, dedicated</p>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h6 class="font-semibold text-orange-900 mb-2">Global Health</h6>
                <p class="text-sm text-orange-700">Negotiated</p>
                <p class="text-xs text-orange-600 mt-1">WHO, NGOs, LMIC governments</p>
              </div>
            </div>

            <h4 class="font-tiempos text-xl font-semibold text-slate-900 mb-4">7.1.3 Traditional Medicine Content Subscription</h4>

            <div class="overflow-x-auto mb-8">
              <table class="w-full text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium">Tier</th>
                    <th class="text-left py-2 px-3 font-medium">Price</th>
                    <th class="text-left py-2 px-3 font-medium">Features</th>
                  </tr>
                </thead>
                <tbody class="text-slate-700">
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Healio Basic</td>
                    <td class="py-2 px-3">Free</td>
                    <td class="py-2 px-3">Limited symptom checks, basic Prakriti</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Healio Plus</td>
                    <td class="py-2 px-3">$9.99/month</td>
                    <td class="py-2 px-3">Unlimited AI consultations, full traditional system access</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Healio Pro</td>
                    <td class="py-2 px-3">$29.99/month</td>
                    <td class="py-2 px-3">Plus features + priority booking, personalized protocols</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 font-medium">Healio Scholar</td>
                    <td class="py-2 px-3">$49.99/month</td>
                    <td class="py-2 px-3">Pro features + research participation, advanced analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">7.2 Enterprise Solutions</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-slate-50 p-6 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Hospital System Integration</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• EHR embedded decision support (SMART on FHIR)</li>
                  <li>• Order set integration (CDS Hooks)</li>
                  <li>• Outcome data exchange (HL7 FHIR R4)</li>
                  <li>• Patient portal extension</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-6 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Insurance Reimbursement</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Indian national schemes (PM-JAY, ESIC)</li>
                  <li>• Private insurance AYUSH riders</li>
                  <li>• International experimental benefits</li>
                  <li>• Employer-sponsored global programs</li>
                </ul>
              </div>
              <div class="bg-slate-50 p-6 rounded-lg">
                <h5 class="font-semibold text-slate-900 mb-3">Clinical Trial Matching</h5>
                <ul class="text-sm text-slate-700 space-y-1">
                  <li>• Traditional medicine efficacy trials</li>
                  <li>• Drug-herb interaction studies</li>
                  <li>• Comparative effectiveness research</li>
                  <li>• Real-world evidence generation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 8: Implementation Roadmap -->
        <section id="8-implementation-roadmap">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">8. Implementation Roadmap</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">8.1 Phase 1: Foundation (Weeks 1-4)</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 class="font-semibold text-blue-900 mb-2">Week 1</h5>
                <p class="text-sm text-blue-700">ICD-11 AYUSH Module integration</p>
                <p class="text-xs text-blue-600 mt-1">Success: Dual coding for 100 test cases</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 class="font-semibold text-green-900 mb-2">Week 2</h5>
                <p class="text-sm text-green-700">WHO Acupuncture Database</p>
                <p class="text-xs text-green-600 mt-1">Complete 361-point database</p>
              </div>
              <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 class="font-semibold text-yellow-900 mb-2">Week 3</h5>
                <p class="text-sm text-yellow-700">Enhanced Safety Layer</p>
                <p class="text-xs text-yellow-600 mt-1">50+ emergency patterns</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h5 class="font-semibold text-purple-900 mb-2">Week 4</h5>
                <p class="text-sm text-purple-700">Practitioner Verification</p>
                <p class="text-xs text-purple-600 mt-1">500+ verified practitioners</p>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">8.2 Phase 2: Expansion (Weeks 5-12)</h3>

            <div class="space-y-6 mb-8">
              <div class="bg-slate-50 p-6 rounded-lg">
                <h4 class="font-semibold text-slate-900 mb-3">Weeks 5-6: TCM Diagnostic AI Module</h4>
                <p class="text-sm text-slate-700">
                  Syndrome differentiation engine with tongue image analysis achieving 85%+ accuracy vs. expert consensus.
                </p>
              </div>
              <div class="bg-slate-50 p-6 rounded-lg">
                <h4 class="font-semibold text-slate-900 mb-3">Weeks 7-8: Siddha Varma Integration</h4>
                <p class="text-sm text-slate-700">
                  108-point database with Envagai Thervu assessment and verified practitioner referral system.
                </p>
              </div>
              <div class="bg-slate-50 p-6 rounded-lg">
                <h4 class="font-semibold text-slate-900 mb-3">Weeks 9-10: Cross-System Recommendation Engine</h4>
                <p class="text-sm text-slate-700">
                  Conflict resolution, agreement detection, and personalized presentation with confidence calibration.
                </p>
              </div>
              <div class="bg-slate-50 p-6 rounded-lg">
                <h4 class="font-semibold text-slate-900 mb-3">Weeks 11-12: Integrated Practitioner Portal</h4>
                <p class="text-sm text-slate-700">
                  Multi-specialty dashboard with 100+ active practitioners and positive NPS scores.
                </p>
              </div>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">8.3 Phase 3: Scale (Months 4-6)</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-indigo-50 p-6 rounded-lg">
                <h5 class="font-semibold text-indigo-900 mb-3">Month 4: Advanced Bayesian Network</h5>
                <p class="text-sm text-indigo-700">
                  Full MCMC implementation with complex case reasoning and uncertainty quantification,
                  achieving improved calibration (80% confidence = 80% accuracy).
                </p>
              </div>
              <div class="bg-teal-50 p-6 rounded-lg">
                <h5 class="font-semibold text-teal-900 mb-3">Month 5: Wearable Integration</h5>
                <p class="text-sm text-teal-700">
                  10,000+ connected wearables with continuous Vikriti monitoring,
                  meaningful health insights, and 30% user engagement increase.
                </p>
              </div>
              <div class="bg-amber-50 p-6 rounded-lg">
                <h5 class="font-semibold text-amber-900 mb-3">Month 6: Global Network Launch</h5>
                <p class="text-sm text-amber-700">
                  10 countries, 5,000+ practitioners, $1M+ GMV run rate,
                  with &lt;2% practitioner churn and 4.5+ patient satisfaction. </p>
              </div>
            </div>

            <div class="diagram-container">
              <div class="mermaid-container">
                <div class="mermaid-controls">
                  <button class="mermaid-control-btn zoom-in" title="放大">
                    <i class="fas fa-search-plus"></i>
                  </button>
                  <button class="mermaid-control-btn zoom-out" title="缩小">
                    <i class="fas fa-search-minus"></i>
                  </button>
                  <button class="mermaid-control-btn reset-zoom" title="重置">
                    <i class="fas fa-expand-arrows-alt"></i>
                  </button>
                  <button class="mermaid-control-btn fullscreen" title="全屏查看">
                    <i class="fas fa-expand"></i>
                  </button>
                </div>
                <div class="mermaid">
                  timeline
                  title Healio.AI Product Roadmap

                  section Phase 1: Foundation
                  Week 1 : ICD-11 Integration
                  : WHO Acupuncture Database
                  Week 2 : Enhanced Safety Layer
                  : 50+ Emergency Patterns
                  Week 3 : Practitioner Verification
                  : Multi-system Credential Support
                  Week 4 : Foundation Complete

                  section Phase 2: Expansion
                  Weeks 5-6 : TCM Diagnostic AI
                  : Syndrome Differentiation
                  : Tongue Image Analysis
                  Weeks 7-8 : Siddha Varma Integration
                  : 108-Point Database
                  Weeks 9-10 : Cross-System Engine
                  : Recommendation Fusion
                  Weeks 11-12 : Practitioner Portal Beta

                  section Phase 3: Scale
                  Month 4 : Advanced Bayesian Network
                  : MCMC Implementation
                  Month 5 : Wearable Integration
                  : Continuous Monitoring
                  Month 6 : Global Network Launch
                  : 5,000+ Practitioners
                </div>
              </div>
              <div class="mt-4 text-sm text-slate-600 text-center">
                Healio.AI Implementation Timeline - Three-phase approach from foundation to global expansion
              </div>
            </div>
          </div>
        </section>

        <!-- Section 9: Research &amp; Validation -->
        <section id="9-research--validation-priorities">
          <h2 class="font-tiempos text-4xl font-bold text-slate-900 mb-8">9. Research &amp; Validation Priorities</h2>

          <div class="prose prose-lg max-w-none">
            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">9.1 Clinical Validation Studies</h3>

            <div class="overflow-x-auto mb-8">
              <table class="w-full text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium">Study</th>
                    <th class="text-left py-2 px-3 font-medium">Design</th>
                    <th class="text-left py-2 px-3 font-medium">Population</th>
                    <th class="text-left py-2 px-3 font-medium">Timeline</th>
                    <th class="text-left py-2 px-3 font-medium">Budget</th>
                  </tr>
                </thead>
                <tbody class="text-slate-700">
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Bayesian Engine Accuracy</td>
                    <td class="py-2 px-3">Prospective diagnostic accuracy vs. specialist panel</td>
                    <td class="py-2 px-3">1,000 patients, multi-site</td>
                    <td class="py-2 px-3">12 months</td>
                    <td class="py-2 px-3">$500,000</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Cross-Cultural Diagnostic Agreement</td>
                    <td class="py-2 px-3">Inter-rater reliability across practitioner traditions</td>
                    <td class="py-2 px-3">200 cases, 5 practitioners per tradition</td>
                    <td class="py-2 px-3">6 months</td>
                    <td class="py-2 px-3">$150,000</td>
                  </tr>
                  <tr class="border-b border-slate-200">
                    <td class="py-2 px-3 font-medium">Patient Outcome Tracking</td>
                    <td class="py-2 px-3">Cohort study: traditional vs. conventional vs. integrated care</td>
                    <td class="py-2 px-3">2,000 patients with chronic conditions</td>
                    <td class="py-2 px-3">24 months</td>
                    <td class="py-2 px-3">$1,000,000</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 font-medium">AI-Assisted vs. Standard Care</td>
                    <td class="py-2 px-3">Cluster RCT: Healio-supported vs. usual care</td>
                    <td class="py-2 px-3">50 practitioners, 2,500 patients</td>
                    <td class="py-2 px-3">18 months</td>
                    <td class="py-2 px-3">$750,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="font-tiempos text-2xl font-bold text-slate-900 mb-6">9.2 AI Ethics &amp; Bias Mitigation</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div class="bg-purple-50 p-6 rounded-lg">
                <h5 class="font-semibold text-purple-900 mb-3">Ethical Considerations</h5>
                <ul class="text-sm text-purple-800 space-y-2">
                  <li>• Traditional knowledge representation</li>
                  <li>• Cultural appropriation prevention</li>
                  <li>• Epistemological transparency</li>
                  <li>• Community review processes</li>
                  <li>• Equitable benefit-sharing</li>
                </ul>
              </div>
              <div class="bg-orange-50 p-6 rounded-lg">
                <h5 class="font-semibold text-orange-900 mb-3">Bias Mitigation Strategies</h5>
                <ul class="text-sm text-orange-800 space-y-2">
                  <li>• Diverse training data</li>
                  <li>• Stratified validation</li>
                  <li>• Fairness metrics</li>
                  <li>• Continuous monitoring</li>
                  <li>• Practitioner oversight</li>
                </ul>
              </div>
            </div>

            <div class="bg-slate-100 p-6 rounded-lg mb-8">
              <h5 class="font-semibold text-slate-900 mb-3">Research Partnership Opportunities</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
                <div>
                  <p class="font-semibold mb-2">Academic Institutions</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Traditional medicine departments</li>
                    <li>• AI research centers</li>
                    <li>• Clinical epidemiology</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold mb-2">Healthcare Systems</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Integrative medicine departments</li>
                    <li>• Population health programs</li>
                    <li>• Quality improvement initiatives</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold mb-2">Industry Partners</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Pharmaceutical companies</li>
                    <li>• Insurance providers</li>
                    <li>• Digital health platforms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="px-8 py-12 bg-slate-900 text-white">
          <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 class="font-tiempos text-xl font-bold mb-4">Healio.AI</h3>
                <p class="text-slate-300 text-sm">
                  Bridging modern clinical precision with WHO-standardized ancient wisdom through AI-powered multi-traditional medicine integration.
                </p>
              </div>
              <div>
                <h4 class="font-semibold mb-4">Key Technologies</h4>
                <ul class="text-slate-300 text-sm space-y-2">
                  <li>• Bayesian AI Engine</li>
                  <li>• WHO ICD-11 TM2 Compliance</li>
                  <li>• Multi-Traditional Medicine</li>
                  <li>• Sub-100ms Emergency Detection</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold mb-4">Regulatory Standards</h4>
                <ul class="text-slate-300 text-sm space-y-2">
                  <li>• WHO Traditional Medicine Strategy</li>
                  <li>• AYUSH Ministry Guidelines</li>
                  <li>• FDA 510(k) Pathway</li>
                  <li>• GDPR &amp; HIPAA Compliance</li>
                </ul>
              </div>
            </div>

            <div class="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
              <p>© 2026 Healio.AI - All Rights Reserved. Confidential Internal Technical Documentation.</p>
              <p class="mt-2">Version 4.0.0 | Last Updated: February 7, 2026</p>
            </div>
          </div>
        </footer>
      </div>
    </main>

    <script>
        // Initialize Mermaid with enhanced configuration
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'base',
            themeVariables: {
                // Primary colors with high contrast
                primaryColor: '#f8fafc',
                primaryTextColor: '#1f2937',
                primaryBorderColor: '#374151',
                
                // Secondary colors with good contrast
                secondaryColor: '#f1f5f9',
                secondaryTextColor: '#1e293b',
                secondaryBorderColor: '#475569',
                
                // Tertiary colors
                tertiaryColor: '#e2e8f0',
                tertiaryTextColor: '#1e293b',
                tertiaryBorderColor: '#64748b',
                
                // Line and edge colors
                lineColor: '#4b5563',
                edgeLabelBackground: 'rgba(255, 255, 255, 0.9)',
                
                // Background colors
                background: '#ffffff',
                mainBkg: '#f8fafc',
                secondBkg: '#f1f5f9',
                tertiaryBkg: '#e2e8f0',
                
                // Node-specific colors with high contrast
                cScale0: '#dbeafe',
                cScale1: '#f3e8ff', 
                cScale2: '#dcfce7',
                cScale3: '#fef3c7',
                cScale4: '#fce7f3',
                cScale5: '#ecfdf5',
                cScale6: '#f0f9ff',
                cScale7: '#fef7cd',
                
                // Text colors for each scale
                c0: '#1e3a8a',
                c1: '#581c87',
                c2: '#14532d',
                c3: '#92400e',
                c4: '#831843',
                c5: '#064e3b',
                c6: '#0c4a6e',
                c7: '#78350f'
            },
            flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                curve: 'basis',
                padding: 20
            },
            timeline: {
                useMaxWidth: false,
                padding: 20
            },
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            securityLevel: 'loose'
        });

        // Initialize Mermaid Controls for zoom and pan
        function initializeMermaidControls() {
            const containers = document.querySelectorAll('.mermaid-container');

            containers.forEach(container => {
            const mermaidElement = container.querySelector('.mermaid');
            let scale = 1;
            let isDragging = false;
            let startX, startY, translateX = 0, translateY = 0;

            // 触摸相关状态
            let isTouch = false;
            let touchStartTime = 0;
            let initialDistance = 0;
            let initialScale = 1;
            let isPinching = false;

            // Zoom controls
            const zoomInBtn = container.querySelector('.zoom-in');
            const zoomOutBtn = container.querySelector('.zoom-out');
            const resetBtn = container.querySelector('.reset-zoom');
            const fullscreenBtn = container.querySelector('.fullscreen');

            function updateTransform() {
                mermaidElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

                if (scale > 1) {
                container.classList.add('zoomed');
                } else {
                container.classList.remove('zoomed');
                }

                mermaidElement.style.cursor = isDragging ? 'grabbing' : 'grab';
            }

            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                scale = Math.min(scale * 1.25, 4);
                updateTransform();
                });
            }

            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                scale = Math.max(scale / 1.25, 0.3);
                if (scale <= 1) {
                    translateX = 0;
                    translateY = 0;
                }
                updateTransform();
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                scale = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
                });
            }

            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
                });
            }

            // Mouse Events
            mermaidElement.addEventListener('mousedown', (e) => {
                if (isTouch) return; // 如果是触摸设备，忽略鼠标事件

                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                mermaidElement.style.cursor = 'grabbing';
                updateTransform();
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging && !isTouch) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateTransform();
                }
            });

            document.addEventListener('mouseup', () => {
                if (isDragging && !isTouch) {
                isDragging = false;
                mermaidElement.style.cursor = 'grab';
                updateTransform();
                }
            });

            document.addEventListener('mouseleave', () => {
                if (isDragging && !isTouch) {
                isDragging = false;
                mermaidElement.style.cursor = 'grab';
                updateTransform();
                }
            });

            // 获取两点之间的距离
            function getTouchDistance(touch1, touch2) {
                return Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
                );
            }

            // Touch Events - 触摸事件处理
            mermaidElement.addEventListener('touchstart', (e) => {
                isTouch = true;
                touchStartTime = Date.now();

                if (e.touches.length === 1) {
                // 单指拖动
                isPinching = false;
                isDragging = true;

                const touch = e.touches[0];
                startX = touch.clientX - translateX;
                startY = touch.clientY - translateY;

                } else if (e.touches.length === 2) {
                // 双指缩放
                isPinching = true;
                isDragging = false;

                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = getTouchDistance(touch1, touch2);
                initialScale = scale;
                }

                e.preventDefault();
            }, { passive: false });

            mermaidElement.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1 && isDragging && !isPinching) {
                // 单指拖动
                const touch = e.touches[0];
                translateX = touch.clientX - startX;
                translateY = touch.clientY - startY;
                updateTransform();

                } else if (e.touches.length === 2 && isPinching) {
                // 双指缩放
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = getTouchDistance(touch1, touch2);

                if (initialDistance > 0) {
                    const newScale = Math.min(Math.max(
                    initialScale * (currentDistance / initialDistance),
                    0.3
                    ), 4);
                    scale = newScale;
                    updateTransform();
                }
                }

                e.preventDefault();
            }, { passive: false });

            mermaidElement.addEventListener('touchend', (e) => {
                // 重置状态
                if (e.touches.length === 0) {
                isDragging = false;
                isPinching = false;
                initialDistance = 0;

                // 延迟重置isTouch，避免鼠标事件立即触发
                setTimeout(() => {
                    isTouch = false;
                }, 100);
                } else if (e.touches.length === 1 && isPinching) {
                // 从双指变为单指，切换为拖动模式
                isPinching = false;
                isDragging = true;

                const touch = e.touches[0];
                startX = touch.clientX - translateX;
                startY = touch.clientY - translateY;
                }

                updateTransform();
            });

            mermaidElement.addEventListener('touchcancel', (e) => {
                isDragging = false;
                isPinching = false;
                initialDistance = 0;

                setTimeout(() => {
                isTouch = false;
                }, 100);

                updateTransform();
            });

            // Enhanced wheel zoom with better center point handling
            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const rect = container.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newScale = Math.min(Math.max(scale * delta, 0.3), 4);

                // Adjust translation to zoom towards center
                if (newScale !== scale) {
                const scaleDiff = newScale / scale;
                translateX = translateX * scaleDiff;
                translateY = translateY * scaleDiff;
                scale = newScale;

                if (scale <= 1) {
                    translateX = 0;
                    translateY = 0;
                }

                updateTransform();
                }
            });

            // Initialize display
            updateTransform();
            });
        }

        // Initialize mermaid controls after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize Mermaid Controls
            initializeMermaidControls();
            
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Highlight active section in TOC
            window.addEventListener('scroll', () => {
                const sections = document.querySelectorAll('section[id]');
                const tocLinks = document.querySelectorAll('.sidebar-fixed a[href^="#"]');
                
                let current = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.clientHeight;
                    if (pageYOffset >= sectionTop - 200) {
                        current = section.getAttribute('id');
                    }
                });

                tocLinks.forEach(link => {
                    link.classList.remove('bg-teal-100', 'text-teal-800');
                    if (link.getAttribute('href') === `#${current}`) {
                        link.classList.add('bg-teal-100', 'text-teal-800');
                    }
                });
            });
        });
    </script>
  

</body></html>