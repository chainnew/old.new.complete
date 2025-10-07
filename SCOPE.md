# Scope of Works: old.new Platform
## Developer Testing & Integration Phase

**Project:** old.new - AI-Powered Document Enhancement Platform  
**Version:** 1.1 (Enhanced with Grok 4 Fast Feedback)  
**Date:** October 2025  
**Status:** Pre-Launch Testing Phase  
**AI Partner:** xAI Grok 4 Fast Reasoning

> **v1.1 Update Note:** This scope has been significantly enhanced based on detailed technical feedback from the Grok 4 Fast reasoning model. Key improvements include dynamic prompt engineering, multilingual OCR support, token efficiency ratio tracking, model version management, and comprehensive UAT standards. These enhancements position old.new for scalable, cost-efficient, and globally-accessible document enhancement services.

### 🎉 What's New in v1.1

**For Developers:**
- ✨ **Section 5:** NEW - Dynamic Prompt Engineering & Advanced AI Features
- 🌍 **Section 3.1:** OCR integration with Tesseract for scanned PDFs
- 🗣️ **Section 3.2:** Multilingual support (12+ languages) with cultural context
- 📊 **Section 8.2:** Token Efficiency Ratio (TER) tracking system
- 🔄 **Section 20:** Model version pinning and migration strategies
- 🎯 **Section 4.2:** Enhanced rate limiting with tier-specific configurations
- ✅ **Section 16.1:** Increased code coverage target to 90% + detailed UAT program

**For Project Managers:**
- 90% code coverage requirement (up from 80%)
- Real user testing with 20-30 beta testers
- TER monitoring for cost optimization (target >99% margins maintained)
- Model versioning strategy protects against breaking changes
- Enhanced risk management with 10 identified risks and mitigation plans

**For Stakeholders:**
- Global reach: 12+ languages + OCR for scanned documents
- Premium features: Real-time industry benchmarking via tool-use
- Future-proof: Version pinning ensures stable, predictable costs
- Quality assurance: Comprehensive UAT with subjective validation
- Cost intelligence: Automated optimization recommendations

---

## 1. Executive Summary

This Scope of Works outlines the comprehensive testing and integration requirements for **old.new**, an AI-powered document polishing and enhancement platform. The platform leverages xAI's **grok-4-fast-reasoning** model to provide intelligent document analysis, classification, and enhancement services across multiple document types and industries.

### Platform Overview
- **AI Provider:** xAI (X.AI)
- **Model:** grok-4-fast-reasoning (version pinned: 20251001)
- **Context Window:** 2M tokens
- **Pricing:** $0.20 per million input tokens / $0.50 per million output tokens
- **Primary Function:** Document parsing, analysis, classification, and AI-enhanced polishing
- **Target Users:** Professionals, businesses, academics, content creators
- **Global Support:** 12+ languages with OCR for scanned documents

### v1.1 Enhancements (Based on Grok 4 Fast Feedback)

This updated version incorporates strategic improvements recommended by the Grok AI team to maximize platform effectiveness and future-proofing:

**🎯 Smart Prompt Engineering**
- **Industry-Adaptive Prompts:** Dynamic system prompts that automatically adjust based on detected industry (SaaS, Healthcare, Finance, Legal, etc.)
- **Context-Aware Enhancement:** Prompts adapt to audience type, technical level, and content focus
- **Quality Optimization:** Industry-specific terminology and formatting guidelines built into enhancement logic

**🔧 Premium Tool Integration**
- **Native Tool-Use:** Grok 4 Fast's tool-calling capability for Premium tier
- **Real-Time Benchmarking:** Fetch current industry data to enrich business proposals
- **Citation Verification:** Academic paper enhancement with source validation
- **SEO Intelligence:** Live keyword analysis for blog post optimization

**🌍 Global Document Support**
- **OCR Integration:** Tesseract-powered text extraction from scanned PDFs
- **12+ Languages:** English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, and more
- **Cultural Context:** Language-specific business etiquette and formatting guidance
- **Smart Detection:** Automatic language identification with confidence scoring

**📊 Advanced Cost Intelligence**
- **Token Efficiency Ratio (TER):** Track quality-to-cost performance (target: >30K for Quick, >14K for Pro, >7K for Premium)
- **Variance Tracking:** Monitor actual vs estimated costs with automatic alerts
- **Optimization Recommendations:** AI-driven suggestions to reduce token usage while maintaining quality
- **Daily TER Reports:** Aggregate metrics with actionable insights

**🔄 Future-Proof Architecture**
- **Model Version Pinning:** Lock to specific Grok versions (grok-4-fast-reasoning-20251001) for consistency
- **Migration System:** Automated A/B testing framework for new model versions
- **Gradual Rollout:** Canary → Pilot → Production deployment strategy
- **Backward Compatibility:** 30-day rollback capability for risk mitigation

**🚀 Enhanced Rate Limiting**
- **Tier-Specific Limits:** Tier 1 (10K req/day, 100/min) and Tier 2 (100K req/day, 500/min)
- **Burst Allowance:** 2x rate limit tolerance for 60 seconds
- **Smart Backoff:** Exponential retry with "retry-after" header respect
- **Proactive Throttling:** Slow down at 90% of limits to prevent hard blocks

**✅ Rigorous Quality Standards**
- **90% Code Coverage:** Increased from 80% with focus on critical paths at 100%
- **Real User UAT:** 20-30 beta testers across 5 use cases with detailed feedback forms
- **Subjective Validation:** Tone accuracy, technical precision, and conversion potential ratings
- **Success Criteria:** >4.5/5 satisfaction, >85% would-use-again rate

### Expected Outcomes

**Technical Excellence:**
- 99.5% uptime with auto-scaling and load balancing
- <10s Quick, <15s Professional, <25s Premium enhancement times
- 100% data accuracy with comprehensive error handling
- Zero critical security vulnerabilities

**Business Performance:**
- >99% profit margin per transaction (cost <$0.01, revenue $5-$30)
- 1000+ documents processed in test phase
- Average improvement score >60% (readability/clarity)
- TER optimization reduces AI spend by 20%+

**User Experience:**
- Intuitive upload → analyze → enhance → download flow
- Real-time progress indicators and track changes visualization
- Multi-format export (DOCX, PDF, TXT, HTML)
- Comprehensive before/after analysis

---

## 2. Technical Architecture

### 2.1 Core Technology Stack

**Backend:**
- Node.js / TypeScript
- Express.js API framework
- PostgreSQL database
- Redis for caching and rate limiting

**AI Integration:**
- xAI Grok API (grok-4-fast-reasoning)
- Custom prompt engineering system
- Token usage tracking and cost optimization

**Document Processing:**
- Mammoth.js (DOCX parsing)
- pdf-parse (PDF extraction)
- Native text/markdown support
- Diff library for change tracking

**Authentication & Authorization:**
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for external integrations

### 2.2 Model Agnosticism and LLM Service Abstraction

**Purpose:** Future-proof the platform against evolving LLM landscapes by decoupling core business logic from specific AI providers.

**Strategy:** Implement an adapter pattern that allows seamless provider swapping (xAI Grok, OpenAI GPT, Anthropic Claude, etc.) based on performance, cost, or feature requirements.

**Architecture Pattern:**

```typescript
// Abstract base class defining LLM operations
abstract class LLMAdapter {
  abstract async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse>;
  abstract async analyze(text: string, options: AnalyzeOptions): Promise<AnalyzeResponse>;
  abstract async enhance(prompt: string, options: EnhanceOptions): Promise<EnhanceResponse>;
  abstract calculateCost(inputTokens: number, outputTokens: number): number;
  abstract normalizeResponse(rawResponse: any): StandardResponse;
}

// xAI Grok Implementation
class XAIAdapter extends LLMAdapter {
  private apiKey: string;
  private endpoint: string = 'https://api.x.ai/v1/chat/completions';
  
  constructor() {
    this.apiKey = process.env.XAI_API_KEY!;
  }
  
  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4-fast-reasoning-20251001',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 500
      }),
    });
    
    if (!response.ok) {
      throw new Error(`XAI API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return this.normalizeResponse(data);
  }
  
  async enhance(prompt: string, options: EnhanceOptions): Promise<EnhanceResponse> {
    // Similar implementation for enhancement
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4-fast-reasoning-20251001',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens
      }),
    });
    
    if (!response.ok) {
      throw new Error(`XAI API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return this.normalizeResponse(data);
  }
  
  calculateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1_000_000) * 0.20 + (outputTokens / 1_000_000) * 0.50;
  }
  
  normalizeResponse(rawResponse: any): StandardResponse {
    // Map xAI-specific response format to standard schema
    return {
      content: rawResponse.choices[0].message.content,
      tokensUsed: {
        input: rawResponse.usage.prompt_tokens,
        output: rawResponse.usage.completion_tokens,
        total: rawResponse.usage.total_tokens
      },
      model: rawResponse.model,
      provider: 'xai'
    };
  }
}

// OpenAI Implementation (for comparison/fallback)
class OpenAIAdapter extends LLMAdapter {
  private apiKey: string;
  private endpoint: string = 'https://api.openai.com/v1/chat/completions';
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
  }
  
  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse> {
    // Similar to XAI but with OpenAI-specific endpoint/parameters
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 500
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return this.normalizeResponse(data);
  }
  
  calculateCost(inputTokens: number, outputTokens: number): number {
    // OpenAI pricing (example: GPT-4 Turbo)
    return (inputTokens / 1_000_000) * 10.00 + (outputTokens / 1_000_000) * 30.00;
  }
  
  normalizeResponse(rawResponse: any): StandardResponse {
    // Map OpenAI response format to standard schema
    return {
      content: rawResponse.choices[0].message.content,
      tokensUsed: {
        input: rawResponse.usage.prompt_tokens,
        output: rawResponse.usage.completion_tokens,
        total: rawResponse.usage.total_tokens
      },
      model: rawResponse.model,
      provider: 'openai'
    };
  }
  
  // Implement other abstract methods...
}

// Unified LLM Service with adapter injection
export class LLMService {
  private adapter: LLMAdapter;
  private fallbackAdapter?: LLMAdapter;
  
  constructor(primaryAdapter: LLMAdapter, fallbackAdapter?: LLMAdapter) {
    this.adapter = primaryAdapter;
    this.fallbackAdapter = fallbackAdapter;
  }
  
  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse> {
    try {
      return await this.adapter.classify(text, options);
    } catch (error: any) {
      // Fallback to secondary provider if primary fails
      if (this.fallbackAdapter && this.shouldFallback(error)) {
        console.warn(`Primary provider failed: ${error.message}. Falling back...`);
        return await this.fallbackAdapter.classify(text, options);
      }
      throw error;
    }
  }
  
  async enhance(prompt: string, options: EnhanceOptions): Promise<EnhanceResponse> {
    try {
      return await this.adapter.enhance(prompt, options);
    } catch (error: any) {
      if (this.fallbackAdapter && this.shouldFallback(error)) {
        console.warn(`Primary provider failed: ${error.message}. Falling back...`);
        return await this.fallbackAdapter.enhance(prompt, options);
      }
      throw error;
    }
  }
  
  private shouldFallback(error: any): boolean {
    // Fallback on rate limits, service unavailable, timeouts
    return error.message.includes('429') || 
           error.message.includes('503') || 
           error.message.includes('timeout');
  }
  
  getCostEstimate(inputTokens: number, outputTokens: number): number {
    return this.adapter.calculateCost(inputTokens, outputTokens);
  }
}

// Factory for initialization
export function createLLMService(): LLMService {
  const provider = process.env.LLM_PROVIDER || 'xai';
  const fallbackProvider = process.env.LLM_FALLBACK_PROVIDER;
  
  const adapters: { [key: string]: LLMAdapter } = {
    'xai': new XAIAdapter(),
    'openai': new OpenAIAdapter(),
    // Add more providers as needed
  };
  
  const primaryAdapter = adapters[provider];
  const fallbackAdapter = fallbackProvider ? adapters[fallbackProvider] : undefined;
  
  if (!primaryAdapter) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
  
  return new LLMService(primaryAdapter, fallbackAdapter);
}
```

**Configuration Variables:**
```bash
# Primary provider
LLM_PROVIDER=xai
XAI_MODEL=grok-4-fast-reasoning-20251001
XAI_API_KEY=your_xai_key

# Fallback provider (optional)
LLM_FALLBACK_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_API_KEY=your_openai_key
```

**Test Cases:**

**Provider Switching:**
- [ ] Switch from XAI to OpenAI adapter → Verify identical ClassifyResponse schema
- [ ] Compare quality across providers → Confidence variance ±5% acceptable
- [ ] A/B test 50 enhancements → Track quality scores per provider

**Fallback Mechanism:**
- [ ] Simulate XAI 429 rate limit → Verify automatic fallback to OpenAI
- [ ] Simulate XAI 503 error → Verify fallback completes request
- [ ] Primary and fallback both fail → Verify graceful error to user
- [ ] Fallback success → Verify cost tracked correctly for secondary provider

**Token Normalization:**
- [ ] 1000 input tokens across providers → Verify cost calculations accurate
- [ ] XAI: $0.00020 input, OpenAI: $0.01000 → Budget tracking reflects difference
- [ ] Token counting consistency → ±5% variance acceptable

**Performance:**
- [ ] Swap providers for 50 documents → Measure response time variance <20%
- [ ] Concurrent requests with mixed providers → No race conditions
- [ ] Cache prompt templates per provider → Reduce redundant API calls

**Configuration:**
- [ ] Invalid LLM_PROVIDER value → Graceful error with admin alert
- [ ] Missing API key → Startup validation prevents deployment
- [ ] Model version mismatch → Log warning, attempt with available model

**Expected Benefits:**
- **A/B Testing:** Compare Grok vs Claude for tone adjustments, academic vs business docs
- **Cost Arbitrage:** Switch to cheaper provider if quality maintained
- **Vendor Independence:** No lock-in; can negotiate better rates or switch if xAI changes pricing
- **Reliability:** Fallback ensures uptime even during provider outages

**Integration Effort:**
- Refactor existing `GrokService` in Phase 2 (Week 3-4)
- Add OpenAI adapter for testing purposes
- Document migration guide for future providers

---

## 3. Feature Set to be Tested

### 3.1 Document Upload & Parsing System

#### Requirements:
- [ ] **File Upload Endpoint** (`POST /api/documents/upload`)
  - Support for DOCX, PDF, TXT, MD formats
  - Maximum file size: 10MB
  - Multipart form-data handling via Multer
  - Automatic file type detection
  - Temporary file cleanup after processing

- [ ] **Document Parser Service**
  - PDF text extraction with metadata (page count, word count)
  - DOCX content extraction preserving basic structure
  - Plain text and Markdown parsing
  - Character and word count calculations
  - Basic table and image detection
  - Section and paragraph structure extraction

**Test Cases:**
1. Upload valid DOCX file → Verify successful parse with correct metadata
2. Upload PDF with multiple pages → Verify page count accuracy
3. Upload corrupted file → Verify graceful error handling
4. Upload oversized file (>10MB) → Verify rejection with appropriate error
5. Upload unsupported file type → Verify rejection message
6. Concurrent uploads (10+ simultaneous) → Verify system stability
7. Special characters in filename → Verify safe handling
8. Password-protected PDF → Verify appropriate error message
9. **Scanned PDF (image-based)** → Verify OCR fallback with Tesseract
10. **Multilingual document (Spanish/French/German)** → Verify language detection
11. **Mixed-language document** → Verify primary language identification
12. **Low-quality scan (poor resolution)** → Verify OCR accuracy threshold
13. **Handwritten notes in PDF** → Verify graceful degradation message

**Expected Response Schema:**
```json
{
  "documentId": "uuid-string",
  "text": "extracted document text...",
  "metadata": {
    "pageCount": 5,
    "wordCount": 1543,
    "characterCount": 8921,
    "format": "pdf",
    "hasImages": false,
    "hasTables": true,
    "isScanned": false,
    "ocrApplied": false,
    "detectedLanguage": "en",
    "languageConfidence": 0.98,
    "languages": ["en"]
  },
  "structure": {
    "sections": [...],
    "paragraphs": [...]
  },
  "detectedType": "business_proposal"
}
```

**OCR Integration (Tesseract):**
```typescript
// Add to DocumentParser service
private async parsePDFWithOCR(filePath: string): Promise<ParsedDocument> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  
  // Check if PDF is scanned (low text content relative to pages)
  const isScanned = data.text.trim().length < (data.numpages * 50);
  
  let finalText = data.text;
  let ocrApplied = false;
  
  if (isScanned) {
    try {
      // Convert PDF to images and OCR
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('eng');
      
      // OCR each page (simplified - actual implementation needs pdf-to-image)
      const ocrText = await worker.recognize(/* image data */);
      finalText = ocrText.data.text;
      ocrApplied = true;
      
      await worker.terminate();
    } catch (error) {
      // Log OCR failure, return extracted text (may be minimal)
      console.error('OCR failed:', error);
    }
  }
  
  // Detect language
  const detectedLang = await this.detectLanguage(finalText);
  
  return {
    text: finalText,
    metadata: {
      pageCount: data.numpages,
      wordCount: this.countWords(finalText),
      characterCount: finalText.length,
      format: 'pdf',
      isScanned,
      ocrApplied,
      detectedLanguage: detectedLang.language,
      languageConfidence: detectedLang.confidence,
      languages: detectedLang.allLanguages,
      hasImages: false,
      hasTables: finalText.includes('|') || /\t/.test(finalText)
    },
    structure: this.extractStructure(finalText)
  };
}

private async detectLanguage(text: string): Promise<{
  language: string;
  confidence: number;
  allLanguages: string[];
}> {
  // Use franc or similar library for language detection
  const franc = require('franc');
  const lang = franc(text.substring(0, 1000)); // Check first 1000 chars
  
  // Map ISO 639-3 to ISO 639-1
  const langMap = {
    'eng': 'en', 'spa': 'es', 'fra': 'fr', 'deu': 'de',
    'ita': 'it', 'por': 'pt', 'rus': 'ru', 'zho': 'zh',
    'jpn': 'ja', 'kor': 'ko', 'ara': 'ar'
  };
  
  return {
    language: langMap[lang] || 'en',
    confidence: 0.95, // franc provides confidence via length
    allLanguages: [langMap[lang] || 'en']
  };
}
```

**Required Dependencies:**
```bash
npm install tesseract.js franc pdf-to-img
```

---

### 3.2 Document Classification System

#### Requirements:
- [ ] **AI Classification Endpoint** (`POST /api/documents/classify`)
  - Integration with grok-4-fast-reasoning model
  - Document type detection from 14+ categories
  - Confidence scoring (0.0 - 1.0)
  - Industry and audience identification
  - Tone recommendation

- [ ] **Quick Classification (Heuristic-based)**
  - Pattern-matching for common document types
  - No AI cost for initial classification
  - Fallback when AI classification not requested

**Supported Document Types:**
1. Resume / CV
2. Cover Letter
3. Business Proposal
4. Research Paper
5. Technical Report
6. Blog Post / Article
7. Marketing Copy
8. Email / Correspondence
9. Whitepaper
10. Case Study
11. Business Plan
12. Grant Proposal
13. Thesis / Dissertation
14. Essay / Academic Writing

**Test Cases:**
1. Submit resume sample → Verify correct type: "resume" with >0.9 confidence
2. Submit research paper → Verify academic tone suggestion
3. Submit marketing email → Verify conversational tone + correct audience
4. Submit ambiguous document → Verify confidence <0.7 and "other" classification
5. **Submit Spanish document** → Verify classification accuracy with language note
6. **Submit French business proposal** → Verify type detection across languages
7. **Submit mixed-language document (EN/ES)** → Verify primary language handling
8. Test with 2000+ character excerpt → Verify truncation and processing
9. Compare AI vs heuristic classification accuracy across 20 samples
10. Measure classification response time (<3 seconds expected)
11. **Submit document with non-Latin characters (Arabic/Chinese)** → Verify UTF-8 handling
12. **Test language-specific terminology** → Verify industry detection works cross-language

**Expected Response Schema:**
```json
{
  "type": "business_proposal",
  "confidence": 0.95,
  "subtype": "sales proposal",
  "industry": "technology",
  "audience": "C-suite executives",
  "suggestedTone": "professional",
  "detectedLanguage": "en",
  "multilingualNote": null
}
```

**Multilingual Classification Enhancement:**
```typescript
// Update classification prompt
const MULTILINGUAL_CLASSIFICATION_PROMPT = `
You are an expert document classifier that works across multiple languages.

If the document is not in English:
1. First identify the language
2. Then classify the document type
3. Note any cultural/regional considerations for tone and audience

For non-English documents, add a "multilingualNote" field with guidance like:
"Spanish business proposal - consider regional formality differences (Spain vs. Latin America)"

Supported languages: English, Spanish, French, German, Italian, Portuguese, 
Russian, Chinese, Japanese, Korean, Arabic

Return JSON with language-aware classification.
`;

// Enhanced classifier
class DocumentClassifier {
  async classifyMultilingual(text: string, detectedLang: string): Promise<ClassificationResult> {
    const excerpt = text.substring(0, 2000);
    
    const prompt = `
Language: ${detectedLang}
Document Excerpt:

${excerpt}

Classify this document considering its language and cultural context.
    `;
    
    const response = await GrokService.complete({
      systemPrompt: MULTILINGUAL_CLASSIFICATION_PROMPT,
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 500
    });
    
    const result = JSON.parse(response.content);
    
    // Add language-specific enhancement notes
    if (detectedLang !== 'en') {
      result.multilingualNote = this.getLanguageGuidance(detectedLang, result.type);
    }
    
    return result;
  }
  
  private getLanguageGuidance(lang: string, docType: string): string {
    const guidance = {
      'es': {
        'business_proposal': 'Consider formal "usted" vs informal "tú" based on Spanish region',
        'resume': 'European CV format differs from Latin American resume style',
        'email': 'Spanish business emails tend to be more formal than English'
      },
      'fr': {
        'business_proposal': 'French business culture values formal structure and eloquence',
        'resume': 'Include date of birth and photo (European standard)',
      },
      'de': {
        'business_proposal': 'German business communication values precision and detail',
        'email': 'Use formal "Sie" in professional contexts'
      }
    };
    
    return guidance[lang]?.[docType] || `Document in ${lang} - cultural context considered`;
  }
}
```

---

### 3.3 Document Analysis System

#### Requirements:
- [ ] **AI Analysis Endpoint** (`POST /api/documents/analyze`)
  - Readability scoring (0-100 scale)
  - Clarity assessment
  - Grammar issue detection and counting
  - Sentence complexity analysis
  - Passive voice percentage calculation
  - Technical level assessment
  - Strengths identification (3-5 points)
  - Weaknesses identification (3-5 points)
  - Actionable improvement suggestions (5-7 items)

- [ ] **Quick Analysis (Heuristic-based)**
  - Average sentence length calculation
  - Passive voice percentage estimation
  - Complexity categorization (simple/moderate/complex)
  - No AI cost for basic metrics

**Test Cases:**
1. Analyze well-written business proposal → Expect readability >75
2. Analyze poorly written text with grammar errors → Verify error count accuracy
3. Analyze technical documentation → Verify "advanced" technical level
4. Analyze simple blog post → Verify "basic" or "intermediate" level
5. Compare quick vs AI analysis results for accuracy
6. Test with 5000+ word document → Verify processing completes (<5s)
7. Verify all required fields in response
8. Test edge case: Single sentence document

**Expected Response Schema:**
```json
{
  "readabilityScore": 75,
  "clarityScore": 80,
  "grammarIssues": 12,
  "sentenceComplexity": "moderate",
  "avgSentenceLength": 18,
  "passiveVoicePercentage": 15,
  "technicalLevel": "intermediate",
  "strengths": [
    "Clear structure with logical flow",
    "Effective use of data and examples",
    "Professional tone maintained throughout"
  ],
  "weaknesses": [
    "Some passive voice constructions",
    "Occasional run-on sentences",
    "Repetitive phrasing in sections 2-3"
  ],
  "suggestions": [
    "Break up sentences longer than 25 words",
    "Convert passive voice to active voice",
    "Vary sentence structure for better flow",
    "Remove redundant phrases",
    "Strengthen concluding paragraph"
  ]
}
```

---

### 3.4 Document Enhancement System (Core Feature)

#### Requirements:
- [ ] **Main Enhancement Endpoint** (`POST /api/documents/enhance`)
  - Three enhancement levels: Quick ($5), Professional ($15), Premium ($30)
  - Industry-specific optimization
  - Audience-targeted adjustments
  - Tone customization
  - Special instructions support
  - Track changes generation
  - Before/after analysis comparison

**Enhancement Levels:**

**Quick Polish ($5)**
- Grammar and spelling corrections
- Basic sentence structure improvements
- Readability enhancements
- Basic formatting fixes
- Estimated tokens: 2,000-3,000
- Max tokens: 3,000
- Temperature: 0.3
- Target completion: <10 seconds

**Professional Polish ($15)**
- All Quick features
- Tone adjustment for target audience
- Structure optimization
- Technical accuracy review
- Industry terminology enhancement
- Redundancy removal
- Transition improvements
- Estimated tokens: 4,000-7,000
- Max tokens: 5,000
- Temperature: 0.5
- Target completion: <15 seconds

**Premium Polish ($30)**
- All Professional features
- Deep content restructuring
- Data-driven insights
- Competitive analysis (business docs)
- Visual organization suggestions
- Multiple revision iterations
- Expert-level industry standards
- Strategic positioning advice
- Estimated tokens: 8,000-15,000
- Max tokens: 8,000
- Temperature: 0.7
- Target completion: <25 seconds

**Test Cases:**

1. **Quick Enhancement:**
   - Submit 500-word document with 5+ grammar errors
   - Verify all errors corrected
   - Verify readability improvement
   - Verify cost within expected range ($0.001-0.002)
   - Verify response time <10 seconds

2. **Professional Enhancement:**
   - Submit 1500-word business proposal
   - Specify: Industry = "SaaS", Audience = "Investors"
   - Verify tone adjustment to professional/persuasive
   - Verify industry terminology integration
   - Verify structure improvements with better flow
   - Verify cost within range ($0.003-0.005)

3. **Premium Enhancement:**
   - Submit 3000-word research paper
   - Specify: Field = "Machine Learning"
   - Verify deep restructuring with improved argument flow
   - Verify technical accuracy maintenance
   - Verify strategic suggestions included
   - Verify cost within range ($0.006-0.010)

4. **Edge Cases:**
   - Very short document (50 words) → Verify appropriate handling
   - Very long document (10,000 words) → Verify chunking strategy
   - Document in list format → Verify preservation of structure
   - Document with code snippets → Verify code preservation
   - Document with tables/data → Verify accurate handling

5. **Cost Validation:**
   - Track actual token usage vs estimates
   - Verify Grok API token counting accuracy
   - Calculate actual cost: (input_tokens/1M × $0.20) + (output_tokens/1M × $0.50)
   - Ensure profit margins: Quick >99%, Pro >99%, Premium >99%

**Expected Response Schema:**
```json
{
  "originalText": "original document content...",
  "enhancedText": "improved document content...",
  "changes": [
    {
      "type": "grammar",
      "original": "They was going",
      "enhanced": "They were going",
      "reason": "Subject-verb agreement correction",
      "location": { "start": 150, "end": 165 }
    },
    {
      "type": "style",
      "original": "in order to achieve",
      "enhanced": "to achieve",
      "reason": "Removed wordiness",
      "location": { "start": 420, "end": 439 }
    }
  ],
  "summary": {
    "totalChanges": 47,
    "improvementScore": 68,
    "beforeAnalysis": { /* analysis object */ },
    "afterAnalysis": { /* analysis object */ }
  },
  "cost": 0.00234,
  "tokensUsed": 4500,
  "trackChangesHTML": "<div class='document-comparison'>...</div>"
}
```

---

### 3.5 Specialized Enhancement Endpoints

#### 3.5.1 Business Proposal Enhancement
**Endpoint:** `POST /api/documents/enhance/proposal`

**Special Focus:**
- Executive summary clarity
- Value proposition strengthening
- ROI emphasis
- Professional formatting
- Call-to-action clarity
- Client-specific customization

**Test Cases:**
1. Submit generic proposal → Verify executive summary enhancement
2. Include client info → Verify personalization
3. Verify ROI sections emphasized
4. Test with weak CTA → Verify strengthened action items

---

#### 3.5.2 Research Paper Enhancement
**Endpoint:** `POST /api/documents/enhance/research`

**Special Focus:**
- Academic tone consistency
- Citation format checking
- Logical argument flow
- Technical accuracy preservation
- Abstract clarity
- Methodology description

**Test Cases:**
1. Submit paper with informal language → Verify academic tone application
2. Submit paper with weak methodology → Verify improvements
3. Test with different fields (biology, computer science, etc.)
4. Verify technical terms preserved correctly

---

#### 3.5.3 Blog Post Enhancement
**Endpoint:** `POST /api/documents/enhance/blog`

**Special Focus:**
- Engaging opening hooks
- Scannable formatting (subheadings, bullets)
- Conversational tone
- Clear takeaways
- Strong conclusion with CTA
- SEO keyword integration

**Test Cases:**
1. Submit dry blog post → Verify engaging opening created
2. Include SEO keywords → Verify natural integration
3. Verify subheading creation for scannability
4. Test with weak conclusion → Verify strong CTA added

---

#### 3.5.4 Marketing Copy Enhancement
**Endpoint:** `POST /api/documents/enhance/marketing`

**Special Focus:**
- Benefit-driven language
- Emotional triggers
- Action-oriented phrasing
- Power words integration
- Urgency and scarcity creation
- Social proof suggestions

**Test Cases:**
1. Submit feature-focused copy → Verify benefit transformation
2. Include product info → Verify targeted messaging
3. Verify power words integration
4. Test bland copy → Verify emotional trigger additions

---

### 3.6 Track Changes System

#### Requirements:
- [ ] **Change Tracking Generation**
  - Word-level diff calculation
  - Change categorization (addition, deletion, modification)
  - Location tracking (line, position)
  - Category labeling (grammar, style, structure, clarity)
  - HTML visualization with highlighting

**Test Cases:**
1. Compare identical texts → Verify empty changes array
2. Compare texts with 10+ changes → Verify accurate detection
3. Verify addition highlighting in HTML (green background)
4. Verify deletion highlighting in HTML (red strikethrough)
5. Test with special characters → Verify proper HTML escaping
6. Test with line breaks → Verify proper rendering
7. Verify location accuracy for each change
8. Performance test: 5000-word comparison (<2 seconds)

#### Interactive Editing Features (Post-Enhancement Review)

**Purpose:** Enable users to accept, reject, or modify individual changes, providing fine-grained control over the enhancement process.

**Requirements:**

**Interactive Review Endpoint:**
```typescript
// POST /api/documents/{id}/review-changes
interface ReviewChangesRequest {
  documentId: string;
  actions: Array<{
    changeId: string;
    action: 'accept' | 'reject' | 'custom';
    customText?: string; // For action === 'custom'
  }>;
  reEnhanceFlow?: boolean; // Optional light re-enhancement for coherence
}

interface ReviewChangesResponse {
  mergedText: string;
  remainingChanges: Change[];
  appliedCount: number;
  rejectedCount: number;
  customCount: number;
  reEnhanceSummary?: {
    adjustedSections: number;
    coherenceImprovement: number;
  };
  trackChangesHTML: string;
  cost: number;
}

router.post('/documents/:id/review-changes', authenticateUser, async (req, res) => {
  const { documentId } = req.params;
  const { actions, reEnhanceFlow } = req.body;
  
  // Get original document with changes
  const document = await db('documents')
    .where({ id: documentId, user_id: req.user.userId })
    .first();
    
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  // Apply user actions to changes
  const changes = JSON.parse(document.changes);
  let mergedText = document.original_text;
  let appliedCount = 0;
  let rejectedCount = 0;
  let customCount = 0;
  
  for (const action of actions) {
    const change = changes.find(c => c.id === action.changeId);
    if (!change) continue;
    
    switch (action.action) {
      case 'accept':
        mergedText = applyChange(mergedText, change);
        appliedCount++;
        break;
      case 'reject':
        // Keep original text
        rejectedCount++;
        break;
      case 'custom':
        mergedText = applyCustomEdit(mergedText, change, action.customText);
        customCount++;
        break;
    }
  }
  
  // Optional: Light re-enhancement for coherence
  let reEnhanceSummary;
  let cost = 0;
  
  if (reEnhanceFlow && customCount > 0) {
    const quickEnhance = await DocumentEnhancer.enhance({
      text: mergedText,
      documentType: document.document_type,
      level: 'quick',
      specialInstructions: 'Light polish for flow and coherence only. Do not make major changes.'
    });
    
    mergedText = quickEnhance.enhancedText;
    cost = quickEnhance.cost;
    reEnhanceSummary = {
      adjustedSections: quickEnhance.changes.length,
      coherenceImprovement: calculateCoherenceScore(document.original_text, mergedText)
    };
  }
  
  // Update document with merged text
  await db('documents')
    .where({ id: documentId })
    .update({
      enhanced_text: mergedText,
      updated_at: new Date()
    });
  
  // Generate new track changes HTML for remaining changes
  const remainingChanges = changes.filter(c => 
    !actions.find(a => a.changeId === c.id)
  );
  
  const trackChangesHTML = TrackChangesGenerator.generateHTMLComparison(
    document.original_text,
    mergedText
  );
  
  res.json({
    mergedText,
    remainingChanges,
    appliedCount,
    rejectedCount,
    customCount,
    reEnhanceSummary,
    trackChangesHTML,
    cost
  });
});
```

**Frontend Integration Points:**

**Side-by-Side Viewer:**
```jsx
// React component example
function InteractiveReviewPanel({ documentId, changes, originalText, enhancedText }) {
  const [selectedChanges, setSelectedChanges] = useState([]);
  const [customEdits, setCustomEdits] = useState({});
  const [previewText, setPreviewText] = useState(enhancedText);
  
  const handleAccept = (changeId) => {
    setSelectedChanges(prev => [...prev, { changeId, action: 'accept' }]);
    updatePreview();
  };
  
  const handleReject = (changeId) => {
    setSelectedChanges(prev => [...prev, { changeId, action: 'reject' }]);
    updatePreview();
  };
  
  const handleCustomEdit = (changeId, customText) => {
    setCustomEdits(prev => ({ ...prev, [changeId]: customText }));
    setSelectedChanges(prev => [...prev, { changeId, action: 'custom', customText }]);
    updatePreview();
  };
  
  const handleBulkAccept = () => {
    const allChanges = changes.map(c => ({ changeId: c.id, action: 'accept' }));
    setSelectedChanges(allChanges);
    updatePreview();
  };
  
  const handleBulkReject = () => {
    const allChanges = changes.map(c => ({ changeId: c.id, action: 'reject' }));
    setSelectedChanges(allChanges);
    setPreviewText(originalText);
  };
  
  const submitReview = async () => {
    const response = await fetch(`/api/documents/${documentId}/review-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions: selectedChanges, reEnhanceFlow: customEdits.length > 0 })
    });
    const result = await response.json();
    // Handle success - show final document
  };
  
  return (
    <div className="interactive-review">
      <div className="toolbar">
        <button onClick={handleBulkAccept}>Accept All</button>
        <button onClick={handleBulkReject}>Reject All</button>
        <button onClick={() => history.back()}>Undo Last</button>
      </div>
      
      <div className="side-by-side">
        <div className="original">
          <h3>Original</h3>
          <div dangerouslySetInnerHTML={{ __html: originalText }} />
        </div>
        
        <div className="changes-panel">
          <h3>Changes ({changes.length})</h3>
          {changes.map(change => (
            <div key={change.id} className={`change change-${change.type}`}>
              <div className="change-header">
                <span className="change-type">{change.type}</span>
                <span className="change-reason" title={change.reason}>
                  {change.reason}
                </span>
              </div>
              
              <div className="change-content">
                <div className="original-text">
                  <del>{change.original}</del>
                </div>
                <div className="enhanced-text">
                  <ins>{change.enhanced}</ins>
                </div>
              </div>
              
              <div className="change-actions">
                <button onClick={() => handleAccept(change.id)}>
                  ✓ Accept
                </button>
                <button onClick={() => handleReject(change.id)}>
                  ✗ Reject
                </button>
                <input
                  type="text"
                  placeholder="Custom edit..."
                  onBlur={(e) => handleCustomEdit(change.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="preview">
          <h3>Preview</h3>
          <div dangerouslySetInnerHTML={{ __html: previewText }} />
        </div>
      </div>
      
      <div className="submit-bar">
        <button onClick={submitReview} className="primary">
          Apply Changes
        </button>
      </div>
    </div>
  );
}
```

**Change Categorization Persistence:**
- Each change retains original AI reasoning in UI tooltips
- Categories displayed with color coding (grammar=blue, style=green, clarity=yellow, structure=purple)
- Hover shows full explanation: "Changed 'was going' to 'went' for subject-verb agreement"

**Session-Based State:**
- Use Redis to persist review state (TTL: 1 hour)
- JWT includes `reviewSessionId` for multi-session continuity
- User can leave and return to complete review

**Interactive Review Test Cases:**

**Basic Functionality:**
- [ ] Load enhanced doc with 20 changes → Verify all changes displayed in interactive viewer
- [ ] Accept 10 changes → Verify merged text reflects accepted changes accurately
- [ ] Reject 5 changes → Verify original text preserved for rejected changes
- [ ] Mix accept/reject → Verify final document contains only accepted changes

**Custom Edits:**
- [ ] Reject change and add custom text → Verify custom text inserted correctly
- [ ] Custom edit triggers re-enhancement → Verify coherence score >80%
- [ ] Multiple custom edits → Verify all applied without conflicts
- [ ] Custom edit with special characters → Verify proper escaping

**Bulk Actions:**
- [ ] Bulk accept all → Verify identical to full enhancedText
- [ ] Bulk reject all → Verify identical to original text
- [ ] Undo last action → Verify state reverts correctly
- [ ] Response time for bulk operations <3 seconds

**Conflict Resolution:**
- [ ] Simulate overlapping changes → Verify prioritization (user edits override AI)
- [ ] Sequential edits affecting same location → Verify correct text order
- [ ] Conflicting categorizations → Verify latest action wins

**Real-Time Preview:**
- [ ] Accept change → Preview updates immediately without page refresh
- [ ] Reject change → Preview reverts to original for that section
- [ ] Custom edit → Preview shows user's text
- [ ] Preview accuracy compared to final → 100% match

**Mobile Responsiveness:**
- [ ] Touch interactions (swipe to accept/reject) → Verify smooth UX
- [ ] Mobile viewport (320px) → Verify layout doesn't break
- [ ] Pinch-to-zoom → Verify text remains readable
- [ ] Landscape mode → Verify side-by-side still functional

**Edge Cases:**
- [ ] Empty changes list → Verify "No changes made" message with direct download
- [ ] Single change → Verify interface still functional
- [ ] 100+ changes → Verify performance (lazy loading, pagination)
- [ ] Network interruption during review → Verify state recovery from Redis
- [ ] Session expiry (>1 hour) → Verify graceful handling with re-auth

**Cost Validation:**
- [ ] Custom edits trigger re-enhancement → Verify <500 tokens used
- [ ] Re-enhancement cost <10% of original enhancement
- [ ] No re-enhancement needed → Verify cost = $0.00
- [ ] Multiple iterations → Verify cumulative cost tracked accurately

**User Flow Integration:**
Post-enhancement, user redirected to interactive review page (default view). Can skip review and download immediately if satisfied.

**Expected Response Schema:**
```json
{
  "mergedText": "final user-approved content with all changes applied...",
  "remainingChanges": [],
  "appliedCount": 15,
  "rejectedCount": 3,
  "customCount": 2,
  "reEnhanceSummary": {
    "adjustedSections": 2,
    "coherenceImprovement": 12
  },
  "trackChangesHTML": "<div class='interactive-review'>...</div>",
  "cost": 0.0005
}
```

---

### 3.7 Large Document Handling (Chunking Strategy)

**Purpose:** Handle documents exceeding 80% of the LLM context window (>1.6M tokens for Grok's 2M limit) while maintaining contextual integrity.

**Challenge:** Documents over 50,000 words or 1M tokens risk truncation errors and context loss.

**Solution:** Implement semantic chunking with map-reduce pattern for processing.

Due to length constraints, I'll create a separate implementation file. The complete code is available in the repository at `/backend/services/document/ChunkingService.ts`.

**Key Features:**
- Automatic detection when document exceeds 80% of context window
- Semantic chunking respecting section and paragraph boundaries
- Map-Reduce pattern: process chunks in parallel, then combine results
- Context summaries passed between chunks for continuity
- RAG strategy for ultra-large documents (>10 chunks)
- Final coherence pass to ensure smooth flow

**Test Cases:**
- [ ] 60,000-word document (10 chunks) → Verify end-to-end enhancement completes
- [ ] Cross-chunk flow score >90% via manual/AI evaluation
- [ ] Performance: 5-chunk doc <40 seconds total
- [ ] Token overhead <30% vs single-pass estimate
- [ ] Edge: Ultra-large (>200K words) → Suggest user split
- [ ] Error: >50% chunks fail → Abort with user notification

**Response Schema Addition:**
```json
{
  "chunkInfo": {
    "totalChunks": 4,
    "processed": 4,
    "contextLossRisk": "low",
    "tokensPerChunkAvg": 350000,
    "coherencePassApplied": true
  }
}
```

---

### 3.8 User Feedback Loop

**Purpose:** Enable continuous improvement through structured feedback collection and prompt refinement.

**Requirements:**

**Feedback Endpoints:**
- `POST /api/feedback/{docId}` - Submit rating (1-5), reasons (multi-select), optional comments
- `GET /api/feedback/stats` - Admin analytics on feedback patterns (weekly/monthly)

**Key Features:**
- Per-document and per-change feedback collection
- Anonymous by default with opt-in for detailed sharing
- Automatic re-enhancement credit if rating <3
- Weekly aggregation identifies patterns (e.g., "25% reject passive voice")
- Dynamic prompt adjustment based on feedback patterns
- A/B testing framework for prompt variants

**Privacy Controls:**
- User IDs hashed (SHA-256) when opt-in shared
- PII detection in comments flagged for manual review
- Opt-in revocable anytime via user profile

**Test Cases:**
- [ ] Submit rating 2 with "Too passive" → Verify stored; prompt variant tested shows 15% improvement
- [ ] 100 simulated feedbacks → Verify aggregation dashboard accurate
- [ ] Interactive reject during editing → Auto-log as feedback
- [ ] Privacy check: Access without opt-in → Verify anonymized
- [ ] Performance: Feedback endpoint <200ms response

**Expected Response:**
```json
{
  "feedbackId": "uuid",
  "acknowledged": true,
  "suggestion": "Thanks! We've noted this for future improvements.",
  "reEnhanceOffered": true,
  "optInReminder": "Consider opting in to help improve the platform!"
}
```

**Integration:** Post-enhancement modal (Section 14.2); Analytics dashboard addition (Section 15.1)

---

## 4. xAI Grok Integration Testing

### 4.1 API Configuration

**Connection Details:**
- **Endpoint:** `https://api.x.ai/v1/chat/completions`
- **Model:** `grok-4-fast-reasoning`
- **Model Version Pinning:** `grok-4-fast-reasoning-20251001` (recommended for production)
- **Authentication:** Bearer token (API key)
- **Input Pricing:** $0.20 per million tokens
- **Output Pricing:** $0.50 per million tokens
- **Context Window:** 2M tokens (Grok 4 Fast capability)
- **Rate Limits:**
  - **Tier 1 (Default):** 10,000 requests/day, 100 requests/minute
  - **Tier 2 (Production):** 100,000 requests/day, 500 requests/minute
  - **Burst Allowance:** Up to 2x rate limit for 60 seconds
  - **Token Limits:** 2M tokens per request (input + output combined)

**Required Environment Variables:**
```bash
XAI_API_KEY=your_api_key_here
XAI_API_ENDPOINT=https://api.x.ai/v1/chat/completions
XAI_MODEL=grok-4-fast-reasoning-20251001  # Version pinned
XAI_RATE_LIMIT_TIER=2                     # Your tier level
XAI_MAX_RETRIES=3
XAI_TIMEOUT_MS=30000
```

### 4.2 Integration Test Cases

**Basic Connectivity:**
- [ ] Test 1: API key validation → Verify successful authentication
- [ ] Test 2: Invalid API key → Verify 401 Unauthorized error
- [ ] Test 3: Network timeout (30s) → Verify graceful degradation
- [ ] Test 4: Rate limit hit → Verify exponential backoff retry
- [ ] **Test 5: Burst rate test** → Send 150 req/min, verify burst allowance
- [ ] **Test 6: Daily limit approach** → Track at 90% daily limit, verify warnings
- [ ] **Test 7: Model version validation** → Verify pinned version accepted
- [ ] **Test 8: Context window test** → Send 1.8M token request, verify handling

**Rate Limit Handling Strategy:**
```typescript
class GrokRateLimiter {
  private requestCount = 0;
  private dailyCount = 0;
  private lastReset = Date.now();
  private readonly TIER_LIMITS = {
    1: { requestsPerMin: 100, requestsPerDay: 10000 },
    2: { requestsPerMin: 500, requestsPerDay: 100000 }
  };
  
  async executeWithBackoff<T>(
    apiCall: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Check rate limits before calling
        await this.checkLimits();
        
        const result = await apiCall();
        this.requestCount++;
        this.dailyCount++;
        return result;
        
      } catch (error: any) {
        if (error.status === 429) {
          attempt++;
          const retryAfter = error.headers?.['retry-after'] || Math.pow(2, attempt);
          
          console.warn(`Rate limit hit. Retrying after ${retryAfter}s (attempt ${attempt}/${maxRetries})`);
          
          if (attempt >= maxRetries) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          
          await this.sleep(retryAfter * 1000);
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  private async checkLimits(): Promise<void> {
    const tier = process.env.XAI_RATE_LIMIT_TIER || '1';
    const limits = this.TIER_LIMITS[tier];
    
    // Reset minute counter
    if (Date.now() - this.lastReset > 60000) {
      this.requestCount = 0;
      this.lastReset = Date.now();
    }
    
    // Check minute limit (leave 10% buffer)
    if (this.requestCount >= limits.requestsPerMin * 0.9) {
      const waitTime = 60000 - (Date.now() - this.lastReset);
      console.warn(`Approaching rate limit. Waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    
    // Check daily limit
    if (this.dailyCount >= limits.requestsPerDay * 0.95) {
      throw new Error('Daily rate limit approaching. Consider upgrading tier.');
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const rateLimiter = new GrokRateLimiter();

// Usage in GrokService
class GrokService {
  async complete(params: CompletionParams): Promise<CompletionResponse> {
    return await rateLimiter.executeWithBackoff(async () => {
      const response = await fetch(XAI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: XAI_MODEL,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt }
          ],
          temperature: params.temperature,
          max_tokens: params.maxTokens
        })
      });
      
      if (!response.ok) {
        const error: any = new Error(`Grok API error: ${response.status}`);
        error.status = response.status;
        error.headers = response.headers;
        throw error;
      }
      
      return await response.json();
    });
  }
}
```

**Token Counting Accuracy:**
- [ ] Test 5: Submit 100-word prompt → Verify token count ±5% accuracy
- [ ] Test 6: Submit 1000-word prompt → Verify consistent counting
- [ ] Test 7: Compare token count between API response and estimate
- [ ] Test 8: Track cumulative tokens across 100 requests

**Cost Calculation Validation:**
```javascript
// Expected formula:
inputCost = (inputTokens / 1_000_000) × 0.20
outputCost = (outputTokens / 1_000_000) × 0.50
totalCost = inputCost + outputCost
```

**Test Scenarios:**
- [ ] 1000 input / 2000 output tokens → $0.00020 + $0.00100 = $0.00120
- [ ] 5000 input / 3000 output tokens → $0.00100 + $0.00150 = $0.00250
- [ ] 10000 input / 5000 output tokens → $0.00200 + $0.00250 = $0.00450

**Response Quality Testing:**
- [ ] Test classification prompt → Verify JSON response validity
- [ ] Test analysis prompt → Verify all required fields present
- [ ] Test enhancement prompt → Verify coherent enhanced text
- [ ] Temperature variation → Verify creativity difference (0.3 vs 0.7)
- [ ] Max tokens limit → Verify truncation handling

**Error Handling:**
- [ ] HTTP 429 (Rate Limit) → Retry with exponential backoff
- [ ] HTTP 500 (Server Error) → Log and retry once
- [ ] HTTP 503 (Service Unavailable) → Queue request or return user-friendly error
- [ ] Timeout (>30s) → Cancel request and notify user
- [ ] Invalid JSON response → Log raw response and return error
- [ ] Model overload → Fall back to alternative processing or queue

---

## 5. Dynamic Prompt Engineering & Advanced AI Features

### 5.1 Industry-Adaptive System Prompts

**Concept:**
Instead of static enhancement prompts, implement dynamic prompt generation that adapts based on detected document metadata (industry, audience, type, complexity).

**Implementation Strategy:**
```typescript
interface PromptContext {
  documentType: string;
  industry?: string;
  audience?: string;
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  tone: string;
  contentFocus?: string[]; // ['ROI', 'data-driven', 'emotional']
}

function buildDynamicPrompt(context: PromptContext, level: EnhancementLevel): string {
  const basePrompt = getBasePrompt(context.documentType);
  
  // Industry-specific enhancements
  const industryContext = context.industry 
    ? INDUSTRY_PROMPTS[context.industry] 
    : '';
  
  // Audience-targeted adjustments
  const audienceContext = context.audience
    ? `Target Audience: ${context.audience}. Adjust complexity and terminology accordingly.`
    : '';
  
  // Technical level adaptation
  const techContext = TECHNICAL_LEVEL_PROMPTS[context.technicalLevel];
  
  return `${basePrompt}

${industryContext}

${audienceContext}

${techContext}

Focus areas for this document: ${context.contentFocus?.join(', ') || 'general enhancement'}

Enhancement Level: ${level}`;
}
```

**Industry-Specific Prompt Additions:**

**SaaS/Technology:**
```
Industry Context: SaaS/Technology
- Emphasize ROI metrics and data-driven results
- Use active voice for product capabilities
- Highlight scalability and integration points
- Reference industry benchmarks (uptime, response time, adoption rates)
- Include quantifiable value propositions (e.g., "30% faster", "2x efficiency")
```

**Healthcare/Medical:**
```
Industry Context: Healthcare
- Maintain HIPAA-compliant language
- Use evidence-based terminology
- Cite relevant medical standards where applicable
- Balance technical accuracy with patient accessibility
- Emphasize outcomes and quality of care metrics
```

**Finance/Banking:**
```
Industry Context: Finance
- Emphasize regulatory compliance language
- Use precise numerical formatting
- Highlight risk mitigation strategies
- Include industry-standard financial terminology
- Reference relevant regulations (SEC, FINRA, etc.)
```

**Legal:**
```
Industry Context: Legal
- Maintain formal, precise language
- Use proper legal citations format
- Emphasize precedent and statutory references
- Clear definitions for ambiguous terms
- Structured argumentation with supporting evidence
```

### 5.2 Native Tool-Use Integration (Premium Tier)

**Grok 4 Fast Capability:**
Leverage Grok's native tool-use for enhanced Premium-tier features.

**Potential Tool Chains:**

**1. Real-Time Industry Benchmarking (Premium)**
```typescript
// When enhancing business proposals or competitive analysis
const toolConfig = {
  tools: [
    {
      name: "web_search",
      description: "Search for current industry benchmarks and competitive data",
      parameters: {
        query: "industry average [metric] 2025"
      }
    }
  ],
  tool_choice: "auto"
};

// Grok can autonomously fetch data to enrich documents
// Example: "Industry average SaaS churn rate is 5.6% (2025)"
```

**2. Citation Verification (Research Papers)**
```typescript
// Verify citations are current and accurate
const citationTool = {
  name: "verify_citation",
  description: "Check if academic citations are properly formatted and accessible"
};
```

**3. SEO Data Integration (Blog Posts)**
```typescript
// Real-time keyword trends and search volume
const seoTool = {
  name: "keyword_analysis",
  description: "Analyze SEO keywords for search volume and competition"
};
```

**Implementation Note:**
Tool-use adds ~500-1000 tokens per call, so reserve for Premium tier where margins support it.

### 5.3 Chain-of-Thought Reasoning

**For Complex Documents (Premium):**
Enable explicit chain-of-thought reasoning for multi-step enhancements.

```typescript
const premiumPrompt = `
You will enhance this document in multiple reasoning steps:

STEP 1: ANALYSIS
- Identify core message and audience
- Detect structural weaknesses
- Note tone inconsistencies

STEP 2: STRATEGY
- Prioritize top 3 improvements
- Plan structural reorganization if needed
- Determine optimal tone adjustments

STEP 3: ENHANCEMENT
- Apply improvements systematically
- Ensure coherence across sections
- Verify technical accuracy

STEP 4: VALIDATION
- Check improvement against original intent
- Verify all changes align with strategy
- Confirm enhanced clarity and impact

Think through each step before providing the enhanced text.
`;
```

**Benefits:**
- Higher quality outputs for complex documents
- Better handling of multi-section restructuring
- More consistent tone across long documents
- Justifiable changes for client presentations

### 5.4 Test Cases for Advanced Features

**Dynamic Prompts:**
- [ ] Test SaaS proposal → Verify ROI emphasis and metrics integration
- [ ] Test healthcare document → Verify HIPAA-compliant language
- [ ] Test legal brief → Verify formal tone and citation structure
- [ ] Compare static vs dynamic prompt quality (blind A/B test)
- [ ] Measure token efficiency: dynamic should be <10% more tokens

**Tool-Use (Premium):**
- [ ] Enable web_search for business proposal → Verify benchmark integration
- [ ] Test citation tool for research paper → Verify accuracy improvements
- [ ] Test SEO tool for blog post → Verify keyword integration
- [ ] Measure cost impact: tool-use should stay <$0.015 per document
- [ ] Verify tool outputs are relevant and enhance quality

**Chain-of-Thought:**
- [ ] Process 3000-word thesis with CoT → Compare vs standard enhancement
- [ ] Measure quality improvement (blind review panel)
- [ ] Verify token usage: CoT adds ~20-30% tokens but improves output
- [ ] Test with complex restructuring needs → Verify coherent results

---

## 6. Optional Feature: Document Templates System

### 6.1 Template System Overview

**Status:** Optional Enhancement (Post-MVP)  
**Purpose:** Provide pre-structured document skeletons to accelerate document creation and reduce token consumption

**Key Benefits:**
- **Token Efficiency:** Pre-defined structures reduce prompt token bloat (15-30% savings on Quick tier)
- **User Experience:** Faster workflow for common document types (resume, proposal, etc.)
- **Consistency:** Industry-standard formatting ensures professional output
- **Beginner-Friendly:** Guides users unfamiliar with document structure best practices

**Strategic Note:**
While Grok 4 Fast can generate complete documents from prompts alone without templates, incorporating optional templates provides:
- Reduced input token costs (fewer instructions needed)
- Higher consistency across similar documents
- Easier onboarding for non-professional writers
- Framework for industry-specific customization

### 6.2 Recommended Template Types

Based on the 14+ supported document types, prioritize these templates:

#### 6.2.1 Resume/CV Templates

**Variants:**
- **Modern Professional** (ATS-optimized, tech industry)
- **Academic CV** (research-focused, publications emphasis)
- **Executive Resume** (C-suite, leadership achievements)
- **Creative Portfolio** (designers, writers, visual roles)

**Structure:**
```json
{
  "templateId": "resume-modern-professional",
  "type": "resume",
  "structure": [
    {
      "section": "Contact Information",
      "placeholder": "Name | Email | Phone | LinkedIn | Location",
      "required": true
    },
    {
      "section": "Professional Summary",
      "placeholder": "2-3 sentence elevator pitch highlighting key achievements and career focus",
      "wordCount": 50
    },
    {
      "section": "Professional Experience",
      "placeholder": "• [Action verb] [quantifiable achievement] resulting in [impact]\n• Led [project] with [metric] improvement",
      "bulletPoints": true,
      "atsOptimized": true
    },
    {
      "section": "Skills",
      "placeholder": "Technical Skills: [comma-separated]\nSoft Skills: [comma-separated]",
      "keywords": []
    },
    {
      "section": "Education",
      "placeholder": "Degree | Institution | Graduation Date | GPA (if >3.5)",
      "required": true
    }
  ],
  "defaultTone": "professional",
  "estimatedWords": 400,
  "targetAudience": "hiring_managers"
}
```

**Enhancement Focus:**
- ATS keyword optimization
- Action verb strengthening (achieved → spearheaded)
- Quantifiable achievements (increased sales → increased sales 43%)

#### 6.2.2 Cover Letter Templates

**Structure:**
```json
{
  "templateId": "cover-letter-standard",
  "type": "cover_letter",
  "structure": [
    {
      "section": "Opening Hook",
      "placeholder": "Compelling opening that connects your background to the role",
      "wordCount": 50
    },
    {
      "section": "Body - Paragraph 1",
      "placeholder": "Why you're interested in this company specifically (research-based)",
      "wordCount": 100
    },
    {
      "section": "Body - Paragraph 2",
      "placeholder": "Relevant experience and skills that match job requirements",
      "wordCount": 100
    },
    {
      "section": "Body - Paragraph 3",
      "placeholder": "What you'll bring to the team; cultural fit",
      "wordCount": 75
    },
    {
      "section": "Closing",
      "placeholder": "Strong CTA requesting interview; professional sign-off",
      "wordCount": 50
    }
  ],
  "defaultTone": "professional",
  "estimatedWords": 375
}
```

#### 6.2.3 Business Proposal Templates

**Variants:**
- **Sales Proposal** (product/service pitch)
- **Grant Proposal** (funding request, nonprofit)
- **Partnership Proposal** (B2B collaboration)
- **RFP Response** (structured vendor response)

**Structure:**
```json
{
  "templateId": "business-proposal-sales",
  "type": "business_proposal",
  "structure": [
    {
      "section": "Executive Summary",
      "placeholder": "One-page overview: problem, solution, value, investment",
      "wordCount": 200,
      "critical": true
    },
    {
      "section": "Problem Statement",
      "placeholder": "Client's current challenge or pain point with supporting data",
      "wordCount": 150
    },
    {
      "section": "Proposed Solution",
      "placeholder": "Your product/service with specific features addressing the problem",
      "wordCount": 300
    },
    {
      "section": "ROI & Benefits",
      "placeholder": "Quantifiable value: cost savings, revenue increase, time saved",
      "wordCount": 200,
      "requiresData": true
    },
    {
      "section": "Implementation Timeline",
      "placeholder": "Phase 1: [duration] - [deliverables]\nPhase 2: [duration] - [deliverables]",
      "structured": true
    },
    {
      "section": "Pricing & Terms",
      "placeholder": "Investment breakdown with payment schedule",
      "wordCount": 150
    },
    {
      "section": "Next Steps",
      "placeholder": "Clear CTA: meeting request, contract signing, pilot program",
      "wordCount": 75
    }
  ],
  "defaultTone": "professional",
  "estimatedWords": 1500,
  "industry": "technology"
}
```

**Enhancement Focus:**
- Executive summary clarity and impact
- Value proposition strengthening with data
- Client-specific customization
- Clear ROI metrics

#### 6.2.4 Research Paper Templates

**Structure:**
```json
{
  "templateId": "research-paper-scientific",
  "type": "research_paper",
  "structure": [
    {
      "section": "Abstract",
      "placeholder": "150-250 word summary: background, methods, results, conclusions",
      "wordCount": 200,
      "critical": true
    },
    {
      "section": "Introduction",
      "placeholder": "Context, literature gap, research question, hypotheses",
      "wordCount": 500
    },
    {
      "section": "Literature Review",
      "placeholder": "Survey of relevant prior research with citations",
      "wordCount": 800,
      "citations": true
    },
    {
      "section": "Methodology",
      "placeholder": "Research design, participants, materials, procedures, analysis plan",
      "wordCount": 600,
      "technical": true
    },
    {
      "section": "Results",
      "placeholder": "Findings with statistical analysis (tables/figures referenced)",
      "wordCount": 700,
      "dataVisualization": true
    },
    {
      "section": "Discussion",
      "placeholder": "Interpretation, implications, limitations, future research",
      "wordCount": 600
    },
    {
      "section": "Conclusion",
      "placeholder": "Summary of key findings and contributions",
      "wordCount": 200
    },
    {
      "section": "References",
      "placeholder": "[Citation format: APA/MLA/Chicago]",
      "citations": true
    }
  ],
  "defaultTone": "academic",
  "estimatedWords": 3600,
  "citationStyle": "APA"
}
```

#### 6.2.5 Blog Post Templates

**Variants:**
- **How-To Guide** (instructional, step-by-step)
- **Listicle** (Top 10, Best X for Y)
- **Thought Leadership** (industry insights, trends)
- **Case Study** (problem-solution-results narrative)

**Structure:**
```json
{
  "templateId": "blog-post-how-to",
  "type": "blog_post",
  "structure": [
    {
      "section": "Hook Introduction",
      "placeholder": "Attention-grabbing opening: statistic, question, or bold statement",
      "wordCount": 100
    },
    {
      "section": "Problem/Context",
      "placeholder": "Why this topic matters to your audience",
      "wordCount": 150
    },
    {
      "section": "Step 1",
      "placeholder": "## [Descriptive H2]\nDetailed instructions with examples",
      "wordCount": 200
    },
    {
      "section": "Step 2-5",
      "placeholder": "Additional steps with clear subheadings",
      "wordCount": 600
    },
    {
      "section": "Key Takeaways",
      "placeholder": "Bullet-point summary of main points",
      "bulletPoints": true
    },
    {
      "section": "Conclusion & CTA",
      "placeholder": "Recap value + call-to-action (comment, share, subscribe)",
      "wordCount": 100
    }
  ],
  "defaultTone": "conversational",
  "estimatedWords": 1200,
  "seoOptimized": true
}
```

#### 6.2.6 Marketing Copy Templates

**Variants:**
- **Product Launch Email**
- **Sales Email** (cold outreach)
- **Newsletter** (company updates, curated content)
- **Landing Page Copy** (hero, features, testimonials, CTA)

**Structure:**
```json
{
  "templateId": "marketing-email-product-launch",
  "type": "marketing_copy",
  "structure": [
    {
      "section": "Subject Line",
      "placeholder": "Compelling subject with urgency or curiosity (40-50 chars)",
      "wordCount": 10,
      "critical": true
    },
    {
      "section": "Preheader",
      "placeholder": "Secondary hook that appears in email preview",
      "wordCount": 15
    },
    {
      "section": "Opening",
      "placeholder": "Personalized greeting + benefit-driven hook",
      "wordCount": 50
    },
    {
      "section": "Problem Agitation",
      "placeholder": "Describe the pain point your product solves",
      "wordCount": 75
    },
    {
      "section": "Solution Presentation",
      "placeholder": "Introduce product with 2-3 key benefits (not features)",
      "wordCount": 100
    },
    {
      "section": "Social Proof",
      "placeholder": "Testimonial, statistic, or case study result",
      "wordCount": 50
    },
    {
      "section": "CTA",
      "placeholder": "Clear action button: 'Get Started Free' or 'See Demo'",
      "wordCount": 20,
      "actionOriented": true
    },
    {
      "section": "Urgency/Scarcity",
      "placeholder": "Limited time offer or exclusive access",
      "wordCount": 25
    }
  ],
  "defaultTone": "conversational",
  "estimatedWords": 345
}
```

#### 6.2.7 Additional Templates

**Technical Report:**
- Abstract, background, technical details (with code/table placeholders), conclusions, references
- Target: 2000-5000 words

**Business Plan:**
- Executive summary, market analysis, operations, financials, risks
- Target: 5000-10000 words

**Case Study:**
- Client background, challenge, solution implemented, results (quantified), testimonial
- Target: 800-1500 words

**Grant Proposal:**
- Needs assessment, project description, methodology, budget justification, evaluation plan
- Target: 2000-4000 words

**Blank Canvas:**
- Title and subtitle placeholders only
- For completely custom documents

### 6.3 Implementation Strategy

#### 6.3.1 Database Schema

**Templates Table:**
```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  structure JSONB NOT NULL,
  default_tone VARCHAR(50),
  estimated_word_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_type ON document_templates(document_type);
CREATE INDEX idx_templates_industry ON document_templates(industry);

-- User-generated documents from templates
CREATE TABLE documents_from_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  template_id UUID REFERENCES document_templates(id),
  filled_content JSONB, -- User's content per section
  generated_text TEXT,
  enhanced_text TEXT,
  enhancement_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template usage analytics
CREATE TABLE template_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id),
  usage_count INTEGER DEFAULT 0,
  avg_enhancement_time DECIMAL(10,2),
  avg_satisfaction_score DECIMAL(3,2),
  last_used_at TIMESTAMP
);
```

#### 6.3.2 API Endpoints

**GET /api/templates**
```typescript
// List all available templates
router.get('/templates', authenticateUser, async (req, res) => {
  const { documentType, industry } = req.query;
  
  const filters: any = { is_active: true };
  if (documentType) filters.document_type = documentType;
  if (industry) filters.industry = industry;
  
  const templates = await db('document_templates')
    .where(filters)
    .select('id', 'template_id', 'name', 'description', 'document_type', 
            'industry', 'estimated_word_count', 'default_tone');
  
  res.json({ templates });
});
```

**GET /api/templates/:templateId**
```typescript
// Get specific template with full structure
router.get('/templates/:templateId', authenticateUser, async (req, res) => {
  const template = await db('document_templates')
    .where({ template_id: req.params.templateId, is_active: true })
    .first();
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.json(template);
});
```

**POST /api/templates/:templateId/generate**
```typescript
// Generate document from template + user content
router.post('/templates/:templateId/generate', authenticateUser, async (req, res) => {
  const { templateId } = req.params;
  const { sectionContent } = req.body; // User's content per section
  
  // Get template
  const template = await db('document_templates')
    .where({ template_id: templateId })
    .first();
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  // Build document from template structure
  let generatedText = '';
  
  for (const section of template.structure) {
    const userContent = sectionContent[section.section] || section.placeholder;
    generatedText += `## ${section.section}\n\n${userContent}\n\n`;
  }
  
  // Store generated document
  const document = await db('documents_from_templates').insert({
    user_id: req.user.userId,
    template_id: template.id,
    filled_content: sectionContent,
    generated_text: generatedText
  }).returning('*');
  
  res.json({
    documentId: document[0].id,
    generatedText,
    metadata: {
      wordCount: generatedText.split(/\s+/).length,
      template: template.name,
      estimatedEnhancementCost: estimateEnhancementCost(generatedText.length)
    }
  });
});
```

**POST /api/templates/:templateId/generate-and-enhance**
```typescript
// Combined endpoint: generate from template + enhance
router.post('/templates/:templateId/generate-and-enhance', 
  authenticateUser, 
  async (req, res) => {
    const { templateId } = req.params;
    const { sectionContent, enhancementLevel = 'professional' } = req.body;
    
    // Step 1: Generate document
    const generated = await generateFromTemplate(templateId, sectionContent);
    
    // Step 2: Enhance using DocumentEnhancer
    const enhanced = await DocumentEnhancer.enhance({
      text: generated.text,
      documentType: generated.documentType,
      level: enhancementLevel,
      industry: generated.industry,
      tone: generated.defaultTone
    });
    
    // Step 3: Track usage
    await trackTemplateUsage(templateId, enhanced.tokensUsed);
    
    res.json({
      ...enhanced,
      templateUsed: generated.templateName
    });
});
```

#### 6.3.3 Template Enhancement Integration

**Optimize prompts using template context:**

```typescript
class DocumentEnhancer {
  async enhanceFromTemplate(
    templateId: string,
    userContent: any,
    level: EnhancementLevel
  ): Promise<EnhancementResult> {
    const template = await getTemplate(templateId);
    
    // Build optimized prompt using template structure
    const optimizedPrompt = `
You are enhancing a ${template.document_type} using the "${template.name}" template.

TEMPLATE STRUCTURE (expected sections):
${template.structure.map(s => `- ${s.section}: ${s.placeholder}`).join('\n')}

USER CONTENT:
${this.formatUserContent(userContent, template)}

Enhancement Level: ${level}
Industry: ${template.industry || 'general'}
Target Tone: ${template.default_tone}

INSTRUCTIONS:
1. Enhance each section according to its purpose in the template
2. Maintain template structure (don't add/remove sections)
3. Ensure content meets estimated word count targets
4. Focus on ${this.getEnhancementFocus(level)}

Return enhanced content maintaining template section format.
`;

    // This prompt is ~30% shorter than generating structure from scratch
    // Token savings: ~200-500 tokens depending on template
    
    return await this.enhance({
      text: this.buildTextFromTemplate(userContent, template),
      documentType: template.document_type,
      level,
      specialInstructions: optimizedPrompt
    });
  }
}
```

### 6.4 Token Cost Optimization

**Estimated Token Savings:**

**Without Template (Cold Start):**
- User prompt: "Create a business proposal for..."
- Grok generates: Structure (300 tokens) + Content (2000 tokens) = 2300 input tokens
- Enhancement pass: 2300 input + 3000 output = 5300 total

**With Template:**
- Template structure: Pre-defined (0 tokens)
- User fills sections: Only content needed (1500 tokens)
- Enhancement pass: 1500 input + 2500 output = 4000 total

**Savings: 25% token reduction = ~$0.0003 per document**

At 1000 documents/month: **$0.30 monthly savings + faster processing**

### 6.5 Test Cases

**Template Functionality:**
- [ ] List templates by document type → Verify correct filtering
- [ ] Get template by ID → Verify structure returned
- [ ] Generate document from template → Verify section merging
- [ ] Generate with missing sections → Verify placeholders used
- [ ] Enhance template-generated document → Verify structure preserved
- [ ] Test all 10 template types → Verify appropriate defaults

**Template Analytics:**
- [ ] Track template usage → Verify count increments
- [ ] Most popular templates → Verify correct ranking
- [ ] Avg enhancement time per template → Verify accurate timing
- [ ] User satisfaction by template → Verify score aggregation

**Edge Cases:**
- [ ] User provides extra sections → Verify graceful handling
- [ ] Empty section content → Verify placeholder retention
- [ ] Very long section (>1000 words) → Verify no truncation
- [ ] Template with special characters → Verify proper encoding

### 6.6 User Experience Flow

**Typical User Journey:**

1. **Browse Templates**
   - User selects document type: "Business Proposal"
   - System shows 3-4 template variants with previews
   
2. **Select Template**
   - User chooses "SaaS Sales Proposal"
   - System displays template structure with section descriptions

3. **Fill Content**
   - User types or pastes content into each section
   - Real-time word count feedback per section
   - Optional: Skip sections (placeholders used)

4. **Select Enhancement Level**
   - Quick ($5), Professional ($15), or Premium ($30)
   - Show estimated completion time and token cost

5. **Generate & Enhance**
   - System builds document from template
   - Grok enhances maintaining structure
   - Track changes displayed

6. **Download**
   - DOCX, PDF, or TXT with proper formatting

**Implementation Priority:**
- **Phase 1 (MVP):** No templates - pure enhancement focus
- **Phase 2 (Post-Beta):** Add 3-5 most-requested templates (resume, cover letter, proposal)
- **Phase 3 (Scale):** Full 10-15 template library with analytics
- **Phase 4 (Enterprise):** Custom template creation for enterprise users

---

## 7. Database & Persistence Testing

### 7.1 Database Schema

**Tables to Create:**
1. `documents` - Main document records
2. `document_versions` - Version history tracking
3. `document_usage` - Usage analytics per document type
4. `token_usage` - Detailed token consumption tracking
5. `users` - User accounts and authentication
6. `usage_limits` - Tier-based monthly limits
7. `feedback` - User feedback on enhancements (NEW in v1.1)
8. `prompt_variants` - A/B testing prompt variations (NEW in v1.1)
9. `user_credits` - Re-enhancement credits from feedback (NEW in v1.1)

**New Schema Additions (v1.1):**

```sql
-- User feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  hashed_user_id VARCHAR(64), -- SHA-256 hash for anonymization
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  reasons JSONB, -- Array of rejection reasons
  comment TEXT,
  change_specific JSONB, -- Per-change feedback
  opt_in_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_doc ON feedback(doc_id);
CREATE INDEX idx_feedback_rating ON feedback(overall_rating);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- Prompt variants for A/B testing
CREATE TABLE prompt_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_type VARCHAR(50), -- 'feedback_driven', 'experimental', etc.
  adjustments JSONB, -- Prompt modifications
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User credits (for re-enhancement offers)
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_type VARCHAR(50), -- 'feedback_reenhance'
  amount INTEGER DEFAULT 1,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credits_user ON user_credits(user_id);
CREATE INDEX idx_credits_expires ON user_credits(expires_at);
```

### 7.2 Test Cases

**Documents Table:**
- [ ] Insert new document → Verify UUID generation
- [ ] Store JSONB metadata → Verify query performance
- [ ] Store large text (50,000+ words) → Verify TEXT field handling
- [ ] Update enhanced_text → Verify version tracking triggers
- [ ] Delete document → Verify cascade to versions table
- [ ] Query by user_id → Verify index usage (EXPLAIN ANALYZE)
- [ ] Query by document_type → Verify filtered results
- [ ] Full-text search on original_text → Verify search performance

**Document Versions:**
- [ ] Create version on update → Verify automatic versioning
- [ ] Retrieve version history → Verify chronological order
- [ ] Compare versions → Verify change tracking accuracy
- [ ] Limit versions to 10 per document → Verify old version cleanup

**Usage Tracking:**
- [ ] Log token usage per request → Verify accurate recording
- [ ] Aggregate monthly usage per user → Verify SUM() accuracy
- [ ] Check usage limit enforcement → Verify limit blocking
- [ ] Analytics query (usage by doc type) → Verify aggregation

**Performance Benchmarks:**
- [ ] Insert 1000 documents → Complete in <10 seconds
- [ ] Query 10,000 documents with pagination → <500ms per page
- [ ] Full-text search across 50,000 documents → <2 seconds
- [ ] Concurrent writes (50 simultaneous) → No deadlocks

---

## 8. Authentication & Authorization

### 8.1 Authentication System

**Requirements:**
- [ ] User registration with email/password
- [ ] JWT token generation (24-hour expiry)
- [ ] Token refresh mechanism
- [ ] Password hashing (bcrypt, 12 rounds)
- [ ] Email verification
- [ ] Password reset flow

### 8.2 Authorization Levels

**Tier System:**
- **Free Tier:** 5 documents/month, Quick only
- **Starter ($29/mo):** 50 documents/month, Quick + Pro
- **Professional ($99/mo):** 200 documents/month, All levels
- **Enterprise (Custom):** Unlimited, API access, white-label

### 8.3 Test Cases

- [ ] Register new user → Verify JWT token returned
- [ ] Login with correct credentials → Verify token generation
- [ ] Login with incorrect password → Verify 401 error
- [ ] Access protected endpoint without token → Verify 401 error
- [ ] Access with expired token → Verify 401 error
- [ ] Exceed tier limit → Verify 429 Too Many Requests
- [ ] Free tier attempts Professional enhancement → Verify 403 Forbidden
- [ ] Token refresh before expiry → Verify new token issued

---

## 9. Rate Limiting & Usage Management

### 9.1 Rate Limiting Strategy

**Limits:**
- **Per User:** 10 requests/minute
- **Per IP:** 30 requests/minute
- **Daily Limit:** Based on tier (see pricing)

**Implementation:**
- Redis-based sliding window counter
- Graceful degradation on Redis failure
- Clear error messages with retry-after headers

### 9.2 Test Cases

- [ ] Make 11 requests in 1 minute → Verify 11th request blocked
- [ ] Wait 60 seconds, retry → Verify request succeeds
- [ ] Exceed daily document limit → Verify upgrade prompt
- [ ] Redis connection fails → Verify fallback to in-memory limiting
- [ ] Concurrent requests from same user → Verify accurate counting

---

## 10. Cost Optimization Testing

### 10.1 Token Optimization Strategies

**Techniques:**
1. **Prompt Caching:** Cache classification prompts (reused frequently)
2. **Truncation:** Limit input to first 3000 characters for analysis
3. **Heuristic Pre-filtering:** Use free quick classification first
4. **Batching:** Combine multiple small enhancements (future)
5. **Model Selection:** Use fastest model for cost-sensitive ops

### 8.2 Cost Monitoring

**Metrics to Track:**
- [ ] Average cost per document type
- [ ] Average cost per enhancement level
- [ ] Total daily AI spend
- [ ] Cost per user
- [ ] Profit margin per transaction
- [ ] **Token efficiency ratio (TER)** - Quality score / Cost
- [ ] **Cost variance** - Actual vs Estimated cost deviation
- [ ] **Token utilization** - Actual tokens vs Max tokens allowed
- [ ] **Model performance trending** - Track quality over time for model updates

**Target Costs (with grok-4-fast-reasoning @ $0.20/$0.50):**
- Quick Enhancement: <$0.002 (target profit: $4.998, TER target: >37,500)
- Professional: <$0.005 (target profit: $14.995, TER target: >16,000)
- Premium: <$0.010 (target profit: $29.990, TER target: >8,000)

**Token Efficiency Ratio (TER) Calculation:**
```typescript
interface TokenEfficiencyMetrics {
  documentId: string;
  enhancementLevel: string;
  qualityScore: number;        // 0-100 from analysis
  tokensUsed: number;
  actualCost: number;
  ter: number;                  // qualityScore / (actualCost * 10000)
  costVariance: number;         // (actual - estimated) / estimated
  timestamp: Date;
}

class TokenEfficiencyTracker {
  async calculateTER(
    documentId: string,
    level: string,
    beforeAnalysis: any,
    afterAnalysis: any,
    tokensUsed: number,
    cost: number
  ): Promise<TokenEfficiencyMetrics> {
    // Quality score based on improvement
    const qualityScore = (
      (afterAnalysis.readabilityScore - beforeAnalysis.readabilityScore) +
      (afterAnalysis.clarityScore - beforeAnalysis.clarityScore)
    ) / 2 + 50; // Normalize to 0-100 scale
    
    // Token Efficiency Ratio (higher is better)
    // Multiply cost by 10000 to get meaningful numbers
    const ter = qualityScore / (cost * 10000);
    
    // Get estimated cost for variance calculation
    const estimatedCost = this.getEstimatedCost(level);
    const costVariance = ((cost - estimatedCost) / estimatedCost) * 100;
    
    const metrics: TokenEfficiencyMetrics = {
      documentId,
      enhancementLevel: level,
      qualityScore,
      tokensUsed,
      actualCost: cost,
      ter,
      costVariance,
      timestamp: new Date()
    };
    
    // Store metrics for analysis
    await this.storeMetrics(metrics);
    
    // Alert if TER below threshold or cost variance >20%
    if (ter < this.getTERThreshold(level) || Math.abs(costVariance) > 20) {
      await this.sendAlert(metrics);
    }
    
    return metrics;
  }
  
  private getTERThreshold(level: string): number {
    const thresholds = {
      'quick': 30000,       // 75 quality / $0.0025
      'professional': 14000, // 70 quality / $0.005
      'premium': 7000        // 70 quality / $0.010
    };
    return thresholds[level] || 10000;
  }
  
  async getDailyTERReport(): Promise<TERReport> {
    // Aggregate TER data for the day
    const metrics = await this.getTodaysMetrics();
    
    return {
      avgTER: this.calculateAverage(metrics, 'ter'),
      avgQuality: this.calculateAverage(metrics, 'qualityScore'),
      avgCost: this.calculateAverage(metrics, 'actualCost'),
      avgCostVariance: this.calculateAverage(metrics, 'costVariance'),
      totalDocuments: metrics.length,
      belowThreshold: metrics.filter(m => m.ter < this.getTERThreshold(m.enhancementLevel)).length,
      recommendations: this.generateOptimizationRecommendations(metrics)
    };
  }
  
  private generateOptimizationRecommendations(metrics: TokenEfficiencyMetrics[]): string[] {
    const recs: string[] = [];
    
    // Check for consistent cost overruns
    const avgVariance = this.calculateAverage(metrics, 'costVariance');
    if (avgVariance > 10) {
      recs.push(`Cost estimates are ${avgVariance.toFixed(1)}% low. Update token estimates.`);
    }
    
    // Check for low quality scores
    const avgQuality = this.calculateAverage(metrics, 'qualityScore');
    if (avgQuality < 65) {
      recs.push('Quality scores below target. Review enhancement prompts.');
    }
    
    // Check for inefficient token usage
    const quickMetrics = metrics.filter(m => m.enhancementLevel === 'quick');
    if (quickMetrics.length > 0) {
      const avgTokens = this.calculateAverage(quickMetrics, 'tokensUsed');
      if (avgTokens > 3000) {
        recs.push('Quick enhancements using too many tokens. Optimize prompts or truncate input.');
      }
    }
    
    return recs;
  }
}

export const terTracker = new TokenEfficiencyTracker();
```

**Dashboard Visualization:**
```typescript
// Track TER over time to detect model performance changes
// If xAI releases Grok 4 Fast v2, we'll see TER changes
interface TERTrend {
  date: string;
  avgTER: number;
  modelVersion: string;
}

// Alert if TER drops >10% week-over-week
// Could indicate: model changes, prompt drift, or data quality issues
```

### 8.3 Test Scenarios

- [ ] Process 100 Quick enhancements → Total cost <$0.20
- [ ] Process 100 Professional enhancements → Total cost <$0.50
- [ ] Process 100 Premium enhancements → Total cost <$1.00
- [ ] Compare actual vs estimated costs → Variance <10%
- [ ] Identify highest-cost operations → Optimize top 3

---

## 11. Performance & Load Testing

### 11.1 Performance Targets

- **Document Upload:** <2 seconds (for 5MB file)
- **Quick Classification:** <1 second
- **AI Classification:** <3 seconds
- **Quick Analysis:** <500ms
- **AI Analysis:** <5 seconds
- **Quick Enhancement:** <10 seconds
- **Professional Enhancement:** <15 seconds
- **Premium Enhancement:** <25 seconds
- **Track Changes Generation:** <2 seconds

### 11.2 Load Testing Scenarios

**Scenario 1: Baseline Load**
- 10 concurrent users
- 50 documents/hour
- Duration: 1 hour
- Success rate: >99%

**Scenario 2: Peak Load**
- 50 concurrent users
- 200 documents/hour
- Duration: 30 minutes
- Success rate: >95%

**Scenario 3: Stress Test**
- 100 concurrent users
- 500 documents/hour
- Duration: 15 minutes
- Identify breaking point

**Scenario 4: Spike Test**
- 0 → 100 users in 10 seconds
- Verify auto-scaling triggers
- Monitor response time degradation

### 11.3 Monitoring Metrics

- [ ] CPU usage under load
- [ ] Memory consumption
- [ ] Database connection pool utilization
- [ ] Redis cache hit rate
- [ ] Average response time (95th percentile)
- [ ] Error rate percentage
- [ ] Grok API rate limit headroom

---

## 12. Error Handling & Logging

### 12.1 Error Categories

**User Errors (4xx):**
- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing/invalid token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Document not found
- 429 Too Many Requests: Rate limit exceeded

**Server Errors (5xx):**
- 500 Internal Server Error: Unexpected error
- 502 Bad Gateway: Grok API unreachable
- 503 Service Unavailable: System overload
- 504 Gateway Timeout: Request took too long

### 12.2 Logging Requirements

**Log Levels:**
- **ERROR:** All failures, exceptions
- **WARN:** Rate limits, usage limits, retries
- **INFO:** Successful operations, key metrics
- **DEBUG:** Detailed flow (dev environment only)

**Log Format (JSON):**
```json
{
  "timestamp": "2025-10-02T14:35:22.123Z",
  "level": "INFO",
  "service": "DocumentEnhancer",
  "userId": "uuid",
  "operation": "enhance_document",
  "documentType": "business_proposal",
  "enhancementLevel": "professional",
  "tokensUsed": 4523,
  "cost": 0.00345,
  "duration": 12.4,
  "success": true
}
```

### 12.3 Test Cases

- [ ] Trigger each error type → Verify correct status code
- [ ] Verify user-friendly error messages
- [ ] Check error log entries → Verify complete context
- [ ] Test retry logic for transient failures
- [ ] Verify sensitive data not logged (passwords, API keys)

---

## 13. Security Testing

### 13.1 Security Requirements

**Input Validation:**
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (HTML escaping in responses)
- [ ] File upload validation (type, size, content)
- [ ] Request payload size limits (10MB max)

**Authentication Security:**
- [ ] Password complexity requirements
- [ ] Account lockout after 5 failed attempts
- [ ] JWT secret rotation strategy
- [ ] Token invalidation on logout

**Data Protection:**
- [ ] Encryption at rest (database)
- [ ] Encryption in transit (HTTPS only)
- [ ] PII handling compliance (GDPR)
- [ ] Document deletion (30-day soft delete)

**API Security:**
- [ ] Rate limiting per endpoint
- [ ] CORS configuration
- [ ] API key rotation for Grok
- [ ] Request signing for external API calls

### 13.2 Penetration Testing

- [ ] Attempt unauthorized access to documents
- [ ] Test for JWT token manipulation
- [ ] Attempt SQL injection in all inputs
- [ ] Test file upload with malicious files
- [ ] Attempt XSS in document text
- [ ] Test CSRF protection
- [ ] Attempt DDoS via rapid requests

### 13.3 Data Privacy and Document Lifecycle

**Explicit Deletion Policy:**

**Permanent Deletion:**
- Users can permanently delete documents immediately via UI/API
- Endpoint: `DELETE /api/documents/{id}/permanent`
- Actions: Wipes document, all versions, feedback, and usage logs
- Audit trail retained for 90 days (compliance requirement only)
- Mandatory double opt-in with warning: "This action is irreversible and complies with GDPR right to erasure"

**Soft Delete:**
- Default deletion: 30-day recovery window (user-initiated only)
- Auto-purge after 30 days
- User can recover within window via UI

**Data Usage for AI Training Policy:**

**User-Facing (TOS/Privacy Policy):**
> "Documents are processed ephemerally via third-party LLMs (e.g., xAI Grok). Your documents are never stored by the AI provider or used for training their models. We do not fine-tune models on user data. Aggregated, anonymized feedback (with explicit opt-in only) is used solely for prompt refinement within our platform, not for model training."

**Opt-In Controls:**
- Checkbox in user profile and signup: "Share anonymized feedback to improve the platform"
- Revocable anytime via settings
- Default: OFF (opt-in required)
- Granular: Applies only to feedback sharing, never to document content

**xAI Alignment:**
- Confirm via xAI API documentation that inputs are not retained for training
- Document in privacy policy with link to xAI's data retention policies

**Storage Security Specifications:**

**Encryption at Rest:**
- PostgreSQL via AWS RDS with KMS-managed keys (AES-256)
- S3 buckets with server-side encryption (SSE-KMS)
- Versioning disabled for PII compliance
- Key rotation: Quarterly

**Encryption in Transit:**
- HTTPS only (TLS 1.3)
- Certificate pinning for mobile apps
- API requests require valid SSL certificate

**Access Policies (RBAC):**
- Users: Read/write only on own documents
- Admins: Read-only with audit logging
- No dev environment access to production data without approval + MFA
- Database access restricted to service accounts only

**Data Lifecycle:**
- Expired soft deletes: Auto-purge nightly cron job
- Orphaned data: Quarterly audits and cleanup
- Backups: Retained 30 days, then purged
- Session data (Redis): 1-hour TTL

**Compliance:**
- **GDPR:** Right to erasure, data portability, access requests
- **CCPA:** Do not sell data, opt-out honored
- PII detection: Flag emails, SSNs, credit cards in uploads for extra consent
- Data Processing Agreement (DPA): Available for enterprise customers

**Test Cases:**

**Deletion:**
- [ ] Permanent delete request → Verify all related records erased (documents, versions, feedback, usage)
- [ ] Audit log created → Verify entry with timestamp, user ID, action
- [ ] Soft delete → Verify 30-day window, then auto-purge
- [ ] Recovery within window → Verify document restored successfully
- [ ] Attempt access after permanent delete → Verify 404 Not Found

**Opt-In/Opt-Out:**
- [ ] Opt-in feedback sharing → Verify anonymized data included in aggregation
- [ ] Opt-out → Verify excluded from all future aggregations
- [ ] Revoke opt-in → Verify retroactive exclusion from analysis
- [ ] Default state → Verify opt-out by default on new accounts

**Storage Security:**
- [ ] Simulate breach → Verify KMS encryption prevents unauthorized access
- [ ] Key rotation → Verify seamless re-encryption
- [ ] Cross-tier access attempt → Free user tries Enterprise doc → 403 Forbidden
- [ ] Database dump → Verify encryption at rest (not plaintext)

**PII Detection:**
- [ ] Upload with email address → Verify warning: "PII detected, confirm upload?"
- [ ] Upload with SSN → Verify flagged for extra consent
- [ ] Upload with credit card → Verify blocked or requires acknowledgment

**Compliance:**
- [ ] GDPR access request → Verify all user data exported in machine-readable format
- [ ] GDPR deletion request → Verify permanent deletion within 30 days
- [ ] CCPA opt-out → Verify "Do Not Sell" preference honored
- [ ] Data retention → Verify no data older than policy allows

**Audit Logging:**
- [ ] Admin views user doc → Verify audit log entry created
- [ ] Failed login attempts → Verify logged with IP, timestamp
- [ ] Data export → Verify logged with user consent verification
- [ ] Quarterly audit → Verify orphaned data identified and removed

**UI/Policy Integration:**
- Privacy notice displayed on first upload
- Link to full privacy policy in footer (every page)
- Consent checkboxes on signup (not pre-checked)
- Settings page for data preferences (opt-in/out, deletion requests)

**Update UAT (Section 18):**
- Add privacy scenarios to user acceptance testing
- Test deletion flow with real users
- Verify privacy policy comprehension
- Collect feedback on data controls clarity

---

## 14. User Experience Testing

### 14.1 Frontend Integration Points

**Document Upload Flow:**
1. User selects file
2. Frontend validates file (type, size)
3. Shows upload progress bar
4. Displays parsed document preview
5. Shows auto-detected document type
6. User confirms or adjusts type

**Enhancement Flow:**
1. User selects enhancement level
2. Shows estimated cost and time
3. Optional: Set industry, audience, tone
4. Click "Polish Document"
5. Real-time progress indicator
6. Display side-by-side comparison
7. Highlight track changes
8. Download enhanced document

### 14.2 UI/UX Test Cases

- [ ] Upload flow completes smoothly
- [ ] Progress indicators accurate
- [ ] Error messages clear and actionable
- [ ] Track changes visualization intuitive
- [ ] Mobile responsiveness (optional)
- [ ] Download in multiple formats (DOCX, PDF, TXT)

### 14.3 Optional UI Evolution: Split-Screen Chat Interface (Phase 4+)

**Status:** EXPLORATORY - Requires user research validation before development

**Concept:** Split-screen interface with AI chatbox (left) and document preview (right), inspired by GitHub Copilot and Grammarly's editor interfaces.

**Critical Assessment:**

**Potential Benefits:**
- Conversational interaction may feel more intuitive for some users
- Streaming responses provide perceived speed (<1s initial response)
- Context-aware suggestions without manual navigation
- Natural language commands ("Fix this sentence", "Make more formal")

**Significant Risks:**
1. **Unvalidated assumption** - No evidence users prefer chat over current upload/enhance workflow
2. **Complexity overhead** - WebSockets, streaming, real-time sync adds technical debt
3. **Mobile UX problems** - Split-screen degrades to stacked views; chat-first may confuse users
4. **Feature redundancy** - Interactive editing (Section 3.6) already provides granular control
5. **Development cost** - Realistic estimate: 120-200 hours (not 40-80), plus infrastructure scaling
6. **Personality risks** - "Grok's wit" in professional documents could backfire with business users
7. **Cognitive load** - Chat + document + track changes = three simultaneous interfaces

**Recommended Approach (If Pursued):**

**Phase 1: User Research (4 weeks)**
- [ ] Survey existing users: "Would you prefer chat or button-based enhancement?"
- [ ] Interview 20 users about their editing workflows
- [ ] Prototype comparison: Chat UI vs current UI with 50 beta testers
- [ ] Success metric: >70% prefer chat AND complete tasks 30% faster
- [ ] If research fails validation, abandon feature

**Phase 2: Minimal Viable Chat (8 weeks)**
Only proceed if Phase 1 validates demand.

**Architecture:**

**Frontend Stack:**
- React 18+ with Next.js for SSR
- Tailwind CSS for responsive layout
- `react-resizable-panels` for split-screen (50/50 default, adjustable)
- WebSocket via Socket.io for streaming
- State management: Zustand for doc/chat sync

**Components:**
```typescript
// Split-screen container
function DocumentChatUI({ documentId, initialContent }) {
  const [messages, setMessages] = useState([]);
  const [docContent, setDocContent] = useState(initialContent);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // WebSocket connection for streaming responses
  const socket = useWebSocket(`wss://api.old.new/chat/${documentId}`);
  
  const handleChatSubmit = async (userMessage: string) => {
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);
    
    // Stream Grok response
    socket.emit('enhance-request', {
      prompt: userMessage,
      documentContext: docContent.substring(0, 3000), // Context window
      documentType: document.type
    });
    
    socket.on('stream-chunk', (chunk) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant' && last.isStreaming) {
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        }
        return [...prev, { role: 'assistant', content: chunk, isStreaming: true }];
      });
    });
    
    socket.on('stream-complete', (finalResponse) => {
      setIsStreaming(false);
      // Optionally apply changes to doc
    });
  };
  
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
        <ChatPanel 
          messages={messages} 
          onSubmit={handleChatSubmit}
          isStreaming={isStreaming}
        />
      </ResizablePanel>
      
      <ResizableHandle />
      
      <ResizablePanel defaultSize={60}>
        <DocumentViewer 
          content={docContent}
          onChange={setDocContent}
          highlightChanges={true}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

**Document Viewer Options:**
- PDF: `react-pdf` with PDF.js
- DOCX: `mammoth.js` for rendering, `slate.js` for editing
- Rich text: `TipTap` or `ProseMirror` with collaborative editing features

**Backend Modifications:**

**Streaming Endpoint:**
```typescript
// WebSocket handler for chat streaming
import { Server } from 'socket.io';

io.on('connection', (socket) => {
  socket.on('enhance-request', async ({ prompt, documentContext, documentType }) => {
    try {
      // Authenticate user
      const userId = await authenticateSocket(socket);
      
      // Rate limiting
      const canProceed = await checkRateLimit(userId, 'chat_request');
      if (!canProceed) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      
      // Stream from Grok
      const stream = await LLMService.streamEnhancement({
        prompt: `${prompt}\n\nDocument context: ${documentContext}`,
        documentType,
        temperature: 0.5,
        maxTokens: 1000
      });
      
      for await (const chunk of stream) {
        socket.emit('stream-chunk', chunk.content);
        await new Promise(resolve => setTimeout(resolve, 50)); // Pace for readability
      }
      
      socket.emit('stream-complete', { totalTokens: stream.totalTokens, cost: stream.cost });
      
      // Track usage
      await trackChatUsage(userId, stream.totalTokens);
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
});
```

**Performance Targets:**
- Initial response: <500ms (streaming starts)
- Full response: <3s for 300-word enhancement
- UI update lag: <100ms (React state updates)
- WebSocket latency: <50ms (Cloudflare edge termination)
- Concurrent users: Support 100 simultaneous chat sessions
- Memory per connection: <5MB

**Infrastructure Requirements:**
- WebSocket server scaling (Socket.io with Redis adapter for multi-instance)
- Cloudflare Workers for edge caching of common prompts
- Redis for connection state persistence
- Increased Linode resources: +2GB RAM, +20% CPU
- Estimated cost: +$150-250/month

**UI/UX Guidelines:**

**Chat Personality:**
- **Professional documents (business, legal, academic):** Formal, concise responses
- **Creative documents (blog, marketing):** Conversational but helpful
- **Never:** Jokes, excessive personality, or "wit" that undermines professionalism
- Auto-suggestions: "Make more formal", "Simplify language", "Check grammar"

**Layout:**
- Desktop: 40/60 split (chat/doc), resizable down to 25/75
- Tablet: 50/50 split, chat collapsible to sidebar
- Mobile (<768px): Stacked vertical (chat on top, swipe to reveal doc)
- Keyboard shortcuts: `Cmd/Ctrl + K` to focus chat, `Esc` to focus document

**Accessibility:**
- ARIA labels for all chat elements
- Screen reader announces streaming responses
- High contrast mode support
- Keyboard navigation between panels (Tab, Arrow keys)

**Test Cases:**

**Functionality:**
- [ ] Chat sends message → Streaming response begins <500ms
- [ ] Apply suggestion to document → Changes reflected with highlight
- [ ] Resize panels → Layout persists across sessions (localStorage)
- [ ] Mobile view → Vertical stack functional, no overlap
- [ ] WebSocket disconnect → Graceful fallback, reconnect attempt
- [ ] Concurrent chats (50 users) → No message cross-contamination

**Performance:**
- [ ] 100 concurrent WebSocket connections → Server stable, <5% CPU increase
- [ ] Streaming 500-word response → UI remains responsive (<100ms lag)
- [ ] Document with 10K words → Chat context extraction <200ms
- [ ] Network throttling (3G) → Streaming still functional, degraded gracefully

**Edge Cases:**
- [ ] Very long user message (>1000 words) → Truncate with warning
- [ ] Malformed markdown in response → Render safely, no XSS
- [ ] User closes tab mid-stream → WebSocket cleaned up server-side
- [ ] Empty document → Chat prompts for content or upload
- [ ] Rapid message spam (>10/sec) → Rate limit, show warning

**Integration with Existing Features:**

**Interactive Editing (Section 3.6):**
- Chat can trigger interactive review: "Show me all changes"
- Accept/reject controls remain in document pane
- Chat provides explanations for suggested changes

**Large Document Chunking (Section 3.7):**
- Chat warns: "Large document detected. Processing in sections..."
- Shows progress: "Analyzed section 1 of 4"
- Context summaries provided automatically

**Feedback Loop (Section 3.8):**
- End of chat session: "How was this helpful? [1-5 stars]"
- Low rating triggers: "What could be improved?"
- Feedback tied to specific chat exchanges

**A/B Testing Strategy:**

**Cohorts:**
- Control: 50% users see current UI (upload → enhance → review)
- Variant: 50% users see chat UI

**Success Metrics:**
- Primary: Task completion time (-30% target)
- Secondary: User satisfaction (>4.5/5 stars)
- Engagement: Time on page (+50% if positive)
- Conversion: Free → Paid tier (+20% target)
- Retention: 7-day return rate (+25% target)

**Failure Conditions (Abort Feature):**
- Task completion time increases
- User satisfaction drops below 4.0/5
- Support tickets increase >50%
- Conversion rate decreases
- Development costs exceed $30K

**Rollout Timeline (Conditional):**

**Week 1-4:** User research & validation
**Week 5-8:** If validated, prototype development
**Week 9-10:** Internal testing & refinement
**Week 11-12:** Beta launch (10% of users)
**Week 13-14:** Analyze metrics, decide go/no-go for full rollout
**Week 15+:** Full rollout or feature retirement

**Alternative Approach (Lower Risk):**

Instead of full chat UI, consider:
1. **Quick Actions Panel:** Floating panel with 5 preset commands ("Fix grammar", "Simplify", etc.)
2. **Inline Suggestions:** Hover tooltips on problem areas with one-click fixes
3. **Guided Workflow:** Step-by-step wizard that feels conversational without chat complexity

These alternatives provide conversational feel without WebSocket infrastructure or chat UI complexity.

**Realistic Cost Estimate:**
- Research: 40 hours ($4,000)
- Design: 60 hours ($6,000)
- Frontend development: 120 hours ($12,000)
- Backend/WebSocket: 80 hours ($8,000)
- Testing & QA: 40 hours ($4,000)
- Infrastructure setup: 20 hours ($2,000)
- **Total: 360 hours / $36,000**

**Decision Gate:** Do NOT proceed past research phase without clear evidence of user demand and measurable benefits over current UI.

---

## 15. Analytics & Reporting

### 15.1 Analytics Dashboard

**Metrics to Display:**
- Documents processed (total, by type)
- Enhancement level distribution
- Average improvement scores
- Cost per document type
- Revenue vs AI costs
- User tier distribution
- Most popular document types

### 15.2 Admin Reports

**Daily Report:**
- Total documents processed
- Total AI cost
- Total revenue
- Profit margin
- Top users by volume
- Error rate

**Monthly Report:**
- User growth
- Churn rate
- Revenue breakdown by tier
- Cost trends
- Feature usage statistics

---

## 16. Deployment & DevOps

### 16.1 Environment Setup

**Environments:**
1. **Development:** Local/Docker
2. **Staging:** Cloud (AWS/GCP) - mirrors production
3. **Production:** Cloud with auto-scaling

**Infrastructure:**
- Application servers (Node.js)
- PostgreSQL database (managed service)
- Redis cache
- File storage (S3/GCS)
- Load balancer
- CDN (for static assets)

### 16.2 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Grok API key validated
- [ ] SSL certificates installed
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Rollback procedure documented
- [ ] Health check endpoint responding
- [ ] Load balancer configured
- [ ] Auto-scaling policies set

### 16.3 Monitoring & Alerting

**Alerts:**
- [ ] Error rate >1%
- [ ] Response time >5 seconds (95th percentile)
- [ ] Database connection pool >80%
- [ ] Disk space <20%
- [ ] Grok API errors >5%
- [ ] Daily AI cost >$100 (configurable)

---

## 17. Documentation Requirements

### 17.1 Technical Documentation

- [ ] **API Documentation** (OpenAPI/Swagger)
  - All endpoints with examples
  - Request/response schemas
  - Authentication flow
  - Error codes reference

- [ ] **Architecture Diagram**
  - System components
  - Data flow
  - External dependencies

- [ ] **Database Schema Documentation**
  - Entity relationships
  - Index strategy
  - Migration history

- [ ] **Deployment Guide**
  - Environment setup
  - Configuration variables
  - Scaling guidelines

### 17.2 Developer Documentation

- [ ] **Setup Guide** (README.md)
  - Prerequisites
  - Installation steps
  - Running locally
  - Running tests

- [ ] **Contributing Guide**
  - Code style
  - Git workflow
  - Pull request process
  - Testing requirements

- [ ] **Troubleshooting Guide**
  - Common issues
  - Debug techniques
  - Log locations

---

## 18. Testing Deliverables

### 18.1 Test Reports Required

1. **Unit Test Report**
   - Code coverage >90% (critical paths must be 100%)
   - All services tested with comprehensive mocks
   - Mock Grok API responses for deterministic testing
   - Edge case coverage for parsing, classification, enhancement
   - Performance benchmarks for key functions

2. **Integration Test Report**
   - All API endpoints tested with real database
   - Database operations verified (CRUD + complex queries)
   - External API integration confirmed (Grok 4 Fast)
   - Rate limiting and retry logic validated
   - Multi-user concurrent operation tests

3. **Performance Test Report**
   - Load test results (baseline, peak, stress scenarios)
   - Bottleneck identification with flame graphs
   - Database query optimization analysis
   - API response time percentiles (p50, p95, p99)
   - Optimization recommendations with projected improvements

4. **Security Test Report**
   - Vulnerability scan results (OWASP Top 10)
   - Penetration test findings with severity ratings
   - Remediation status and timeline
   - Authentication/authorization audit
   - Data encryption verification

5. **Cost Analysis Report**
   - Actual vs estimated costs with variance analysis
   - Cost per document type and enhancement level
   - Token efficiency ratio (TER) tracking
   - Optimization opportunities identified
   - Profit margin validation (target: >99%)
   - ROI projections for first 6 months

6. **User Acceptance Testing (UAT) Report**
   - Test scenarios executed across document types
   - Real user feedback (minimum 20 beta testers)
   - Issues identified with severity and status
   - User satisfaction scores (target: >4.5/5)
   - Feature adoption rates
   - Sign-off status with stakeholder approval

**Enhanced UAT Requirements:**

**Early User Testing Program:**
- **Recruitment:** 20-30 beta testers across different use cases
  - 5 professionals (resume/cover letter users)
  - 5 business users (proposals/reports)
  - 5 academics (research papers/theses)
  - 5 content creators (blogs/marketing)
  - 5 general users (mixed document types)

**UAT Scenarios by Document Type:**

**Resume/Cover Letter:**
- [ ] Upload existing resume → Enhance with Quick Polish
- [ ] Verify grammar corrections improve professionalism
- [ ] User feedback: "Does this make you want to apply?"
- [ ] Subjective rating: Improvement score 1-10

**Business Proposal:**
- [ ] Upload 5-page proposal → Enhance with Professional Polish
- [ ] Specify: Industry (SaaS), Audience (Investors)
- [ ] Verify value proposition strengthened
- [ ] User feedback: "Would you present this to clients?"
- [ ] Subjective rating: Persuasiveness 1-10

**Research Paper:**
- [ ] Upload 10-page academic paper → Enhance with Premium Polish
- [ ] Specify: Field (e.g., Computer Science)
- [ ] Verify academic tone maintained, clarity improved
- [ ] User feedback: "Is technical accuracy preserved?"
- [ ] Subjective rating: Publication readiness 1-10

**Blog Post:**
- [ ] Upload 1200-word blog → Enhance with Professional Polish
- [ ] Provide SEO keywords
- [ ] Verify engaging opening, scannable format
- [ ] User feedback: "Would you publish this?"
- [ ] Subjective rating: Reader engagement 1-10

**Marketing Copy:**
- [ ] Upload sales email → Enhance with Premium Polish
- [ ] Verify benefit-driven language, urgency created
- [ ] User feedback: "Would this convert customers?"
- [ ] Subjective rating: Conversion potential 1-10

**Feedback Collection Form:**
```typescript
interface UATFeedback {
  userId: string;
  documentType: string;
  enhancementLevel: string;
  
  // Quantitative ratings (1-10)
  overallSatisfaction: number;
  qualityImprovement: number;
  valueForMoney: number;
  easeOfUse: number;
  
  // Subjective assessments
  wouldUseAgain: boolean;
  wouldRecommend: boolean;
  
  // Open-ended feedback
  whatWorkedWell: string;
  whatNeedsImprovement: string;
  toneAccuracy: 'perfect' | 'good' | 'needs-work' | 'missed';
  technicalAccuracy: 'perfect' | 'good' | 'needs-work' | 'errors';
  
  // Feature-specific
  trackChangesHelpful: boolean;
  beforeAfterComparisonClear: boolean;
  pricingReasonable: boolean;
  
  timestamp: Date;
}
```

**UAT Success Criteria:**
- [ ] Average overall satisfaction >4.5/5 (9/10)
- [ ] >85% would use again
- [ ] >80% would recommend
- [ ] <5% report technical accuracy errors
- [ ] Tone accuracy rated "perfect" or "good" >90%
- [ ] All critical bugs identified and fixed
- [ ] At least 3 document types tested per user

---

## 19. Success Criteria

### 19.1 Functional Requirements

✅ All document types parsed correctly  
✅ Classification accuracy >85%  
✅ Enhancement improves readability by >10 points  
✅ Track changes accurately identify modifications  
✅ API response times meet targets  
✅ Cost per enhancement within budget  

### 19.2 Non-Functional Requirements

✅ System uptime >99.5%  
✅ Data accuracy 100%  
✅ Security vulnerabilities: 0 critical, 0 high  
✅ Code test coverage >80%  
✅ Documentation complete and accurate  
✅ Profit margin >99% per transaction  

### 19.3 Business Requirements

✅ Platform processes 1000+ documents in test phase  
✅ Average improvement score >60%  
✅ Cost optimization reduces AI spend by >20%  
✅ User satisfaction score >4.5/5  
✅ System ready for public beta launch  

---

## 20. Project Timeline

### Phase 1: Foundation (Week 1-2)
- Setup development environment
- Implement document parser
- Basic API structure
- Database schema

### Phase 2: AI Integration (Week 3-4)
- Grok API integration
- Classification system
- Analysis system
- Initial enhancement tests

### Phase 3: Core Features (Week 5-6)
- Complete enhancement system
- Specialized enhancers
- Track changes system
- Cost tracking

### Phase 4: Testing & Optimization (Week 7-8)
- Comprehensive testing
- Performance optimization
- Security hardening
- Cost optimization

### Phase 5: Documentation & Launch Prep (Week 9-10)
- Complete documentation
- Final testing
- Staging deployment
- Beta launch preparation

---

## 21. Budget & Resources

### 21.1 AI Costs (Testing Phase)

**Estimated Testing Volume:**
- Classification tests: 500 calls × 500 tokens avg = 250K tokens
- Analysis tests: 300 calls × 2000 tokens avg = 600K tokens
- Enhancement tests: 200 calls × 5000 tokens avg = 1M tokens

**Total Estimated Tokens:**
- Input: ~850K tokens × $0.20/M = **$0.17**
- Output: ~1M tokens × $0.50/M = **$0.50**
- **Total Testing Cost: ~$0.67**

**Contingency:** 5× multiplier for iterations = **$3.35 total**

### 21.2 Developer Resources

- **1 Full-Stack Developer:** 10 weeks
- **1 QA Engineer:** 4 weeks (Phases 4-5)
- **1 DevOps Engineer:** 2 weeks (Phase 5)

---

## 22. Risk Management

### 22.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Grok API rate limits | High | Medium | Implement caching, queue system, tiered access |
| Cost overruns | Medium | Low | Real-time monitoring, alerts, circuit breakers |
| Performance issues at scale | High | Medium | Load testing early, auto-scaling, CDN |
| Security vulnerabilities | High | Low | Regular security audits, pen testing, OWASP compliance |
| Document parsing failures | Medium | Medium | Fallback parsers, OCR integration, error handling |
| **Model version changes** | **Medium** | **Medium** | **Version pinning, migration testing, backward compat** |
| **API breaking changes** | **High** | **Low** | **Version pinning, changelog monitoring, deprecation notices** |
| **Quality degradation** | **Medium** | **Low** | **TER monitoring, A/B testing, user feedback loops** |
| **Language support gaps** | **Low** | **Medium** | **Language detection, graceful degradation, user notifications** |
| **Token estimation drift** | **Low** | **Medium** | **Continuous calibration, variance tracking, buffer allocation** |

### 22.2 Contingency Plans

**Grok API Downtime:**
- Queue requests with Redis
- Notify users of 5-10 minute delay
- Provide status page updates
- Fall back to cached results for re-enhancements

**Database Failure:**
- Automated backups every 6 hours
- Hot standby replica with <1min failover
- Point-in-time recovery capability
- Daily backup restoration tests

**Traffic Spike:**
- Auto-scaling policies (scale up at 70% CPU)
- CloudFlare DDoS protection
- Request queue with priority levels
- Graceful degradation (disable non-critical features)

**Cost Spike:**
- Circuit breaker at $500/day AI spend
- Alert at 80% daily budget
- Auto-disable new user signups temporarily
- Emergency rate limiting activation

**Model Evolution Contingency:**

**Scenario: xAI releases Grok 5 or updates Grok 4 Fast**

**Detection:**
- Monitor xAI changelog: https://docs.x.ai/changelog
- Subscribe to API deprecation notices
- Weekly model performance TER checks
- Automated version compatibility tests

**Response Plan:**
```typescript
// Version management system
interface ModelVersion {
  version: string;
  releaseDate: Date;
  deprecationDate?: Date;
  status: 'active' | 'deprecated' | 'sunset';
  compatibilityScore: number;
}

class ModelVersionManager {
  private currentVersion = 'grok-4-fast-reasoning-20251001';
  private testVersion?: string;
  
  async detectNewVersion(): Promise<boolean> {
    // Poll xAI API for available models
    const available = await this.getAvailableModels();
    const newVersions = available.filter(v => 
      v.version !== this.currentVersion &&
      v.releaseDate > this.getCurrentVersionDate()
    );
    
    if (newVersions.length > 0) {
      await this.notifyAdmins(newVersions);
      return true;
    }
    return false;
  }
  
  async testNewVersion(version: string): Promise<MigrationReport> {
    // Run A/B test with 5% traffic
    const testResults = await this.runABTest({
      controlVersion: this.currentVersion,
      testVersion: version,
      sampleSize: 100,
      metrics: ['quality', 'cost', 'latency', 'errorRate']
    });
    
    // Compare TER and quality scores
    const report: MigrationReport = {
      version,
      qualityChange: testResults.qualityDelta,
      costChange: testResults.costDelta,
      latencyChange: testResults.latencyDelta,
      terChange: testResults.terDelta,
      recommendation: this.generateRecommendation(testResults),
      riskLevel: this.assessRisk(testResults)
    };
    
    return report;
  }
  
  async migrateToNewVersion(version: string): Promise<void> {
    // Gradual rollout strategy
    const stages = [
      { name: 'canary', percentage: 5, duration: '24h' },
      { name: 'pilot', percentage: 25, duration: '48h' },
      { name: 'production', percentage: 100, duration: 'complete' }
    ];
    
    for (const stage of stages) {
      await this.deployStage(version, stage);
      await this.monitorStage(stage);
      
      // Rollback if issues detected
      if (await this.detectIssues()) {
        await this.rollback();
        throw new Error(`Migration failed at ${stage.name} stage`);
      }
    }
    
    this.currentVersion = version;
    await this.updateConfig();
  }
  
  private generateRecommendation(results: any): string {
    if (results.qualityDelta > 5 && results.costDelta < 10) {
      return 'RECOMMENDED: Quality improvement with acceptable cost increase';
    }
    if (results.costDelta < -20) {
      return 'RECOMMENDED: Significant cost savings, monitor quality closely';
    }
    if (results.qualityDelta < -5) {
      return 'NOT RECOMMENDED: Quality degradation detected';
    }
    return 'NEUTRAL: Minimal changes, migration optional';
  }
}

export const versionManager = new ModelVersionManager();
```

**Migration Testing Checklist:**
- [ ] Test all 14 document types with new version
- [ ] Compare quality scores across 100 sample documents
- [ ] Validate cost estimates with actual usage
- [ ] Check for prompt compatibility issues
- [ ] Test error handling and edge cases
- [ ] Verify token counting accuracy
- [ ] Run load tests at production scale
- [ ] A/B test with real users (5% traffic)
- [ ] Monitor TER for 48 hours
- [ ] Get stakeholder approval before full rollout

**Backward Compatibility Strategy:**
- Always pin to specific model versions in production
- Test new versions in isolated environment
- Maintain previous version capability for 30 days
- Document all prompt changes required for migration
- Keep rollback scripts ready and tested

---

## 23. Post-Launch Monitoring

### 23.1 KPIs to Track

**Technical KPIs:**
- Uptime percentage
- Average response time
- Error rate
- API success rate
- Database query performance

**Business KPIs:**
- Documents processed per day
- Revenue per day
- AI cost per day
- Profit margin
- User acquisition rate
- Tier conversion rate

**Quality KPIs:**
- Average improvement score
- User satisfaction rating
- Enhancement acceptance rate
- Document re-enhancement rate

### 23.2 Continuous Improvement

- Weekly metrics review
- Monthly optimization sprints
- Quarterly cost analysis
- Bi-annual security audits

---

## 24. Sign-Off

### Acceptance Criteria Met:
- [ ] All functional tests passed
- [ ] Performance benchmarks achieved
- [ ] Security audit cleared
- [ ] Documentation complete
- [ ] Cost targets validated
- [ ] UAT sign-off received

### Approved By:

**Product Owner:** _________________ Date: _______

**Technical Lead:** _________________ Date: _______

**QA Lead:** _________________ Date: _______

---

## Contact & Support

**Project Lead:** [Your Name]  
**Email:** [your-email]  
**Slack:** #old-new-dev  
**Repository:** https://github.com/[org]/old-new  

---

*This Scope of Works is a living document and may be updated as requirements evolve during the testing phase.*

**Version History:**
- v1.0 (Oct 2025): Initial scope document
- v1.1 (Oct 2025): Enhanced with Grok 4 Fast feedback + comprehensive UX/privacy improvements
  - **AI Flexibility (Section 2.2):** Model agnosticism with LLM adapter pattern for provider-agnostic operations
  - **Interactive Editing (Section 3.6):** Accept/reject/customize individual changes post-enhancement
  - **Large Document Handling (Section 3.7):** Semantic chunking with map-reduce for 50K+ word documents
  - **User Feedback Loop (Section 3.8):** Structured feedback collection with prompt refinement
  - **Database Updates (Section 7.1):** Added feedback, prompt_variants, and user_credits tables
  - **Data Privacy (Section 13.3):** Explicit deletion policies, GDPR/CCPA compliance, storage security
  - Added dynamic prompt engineering with industry-adaptive system prompts (Section 5)
  - Integrated native tool-use capabilities for Premium tier (Section 5.2)
  - Added OCR fallback support (Tesseract) for scanned PDFs (Section 3.1)
  - Implemented comprehensive multilingual support (12+ languages) (Section 3.2)
  - Added Grok API rate limit specifications and handling strategies (Section 4.2)
  - Implemented model version pinning (grok-4-fast-reasoning-20251001) (Section 4.1)
  - Added Token Efficiency Ratio (TER) tracking and monitoring (Section 10.2)
  - Increased code coverage target from 80% to 90% (Section 18.1)
  - Enhanced UAT requirements with real user testing program (Section 18.1)
  - Added model evolution risk management and migration strategies (Section 22)
  - Implemented version management system with gradual rollout (Section 22.2)
  - Added cost variance tracking and optimization recommendations (Section 10.2)
  - Optional document templates system (Section 6) - Post-MVP feature

**Key Improvements:**
- 🎯 **Prompt Engineering:** Dynamic, context-aware prompts for better quality
- 🌍 **Global Ready:** OCR + 12 languages with cultural context awareness
- 📊 **Cost Intelligence:** TER tracking to optimize quality-to-cost ratio
- 🔄 **Future-Proof:** Version pinning and migration strategies for model updates
- ✅ **Quality Assurance:** 90% code coverage + comprehensive UAT program
- 🚀 **Premium Features:** Tool-use integration for real-time benchmarking
- 🎨 **User Control:** Interactive review system with per-change accept/reject/edit
- 📏 **Scalability:** Handles documents up to 200K words with semantic chunking
- 🔁 **Continuous Improvement:** Feedback loop refines prompts based on user patterns
- 🔒 **Privacy First:** GDPR/CCPA compliant with granular data controls and explicit opt-ins
- 🔄 **Provider Flexibility:** Adapter pattern enables seamless switching between AI providers