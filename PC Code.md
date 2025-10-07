Coding Requirements Extracted from Scope
Below is a distilled extraction of the coding requirements from the provided scope document (v1.1). I've focused on implementation details, code snippets, schemas, endpoints, test cases requiring code, configurations, and technical specifications that directly inform development. Non-coding elements (e.g., summaries, timelines, budgets, high-level risks) are omitted. Organized by section for traceability.

2.2 Model Agnosticism and LLM Service Abstraction
Requirements:

Implement adapter pattern for LLM providers (e.g., xAI Grok, OpenAI GPT) using abstract base class.
Decouple business logic from providers: Support classify, analyze, enhance operations.
Factory for initialization based on env vars.
Fallback on errors (rate limits, 503, timeouts).
Normalize responses to standard schema.
Test cases: Provider switching, fallback, token normalization, performance, configuration.
Standard Response Schema:


interface StandardResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  provider: 'xai' | 'openai';
}

interface ClassifyOptions { systemPrompt: string; temperature?: number; maxTokens?: number; }
interface ClassifyResponse extends StandardResponse { /* classification-specific fields */ }
interface AnalyzeOptions { /* ... */ }
interface AnalyzeResponse extends StandardResponse { /* ... */ }
interface EnhanceOptions { systemPrompt: string; temperature: number; maxTokens: number; }
interface EnhanceResponse extends StandardResponse { /* ... */ }
Code Implementation:


// Abstract base class
abstract class LLMAdapter {
  abstract async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse>;
  abstract async analyze(text: string, options: AnalyzeOptions): Promise<AnalyzeResponse>;
  abstract async enhance(prompt: string, options: EnhanceOptions): Promise<EnhanceResponse>;
  abstract calculateCost(inputTokens: number, outputTokens: number): number;
  abstract normalizeResponse(rawResponse: any): StandardResponse;
}

// XAI Grok Adapter
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
    return this.normalizeResponse(data) as ClassifyResponse;
  }
  
  async enhance(prompt: string, options: EnhanceOptions): Promise<EnhanceResponse> {
    // Implementation similar to classify, adjusted for enhance
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
    return this.normalizeResponse(data) as EnhanceResponse;
  }
  
  calculateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1_000_000) * 0.20 + (outputTokens / 1_000_000) * 0.50;
  }
  
  normalizeResponse(rawResponse: any): StandardResponse {
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

// OpenAI Adapter (similar structure)
class OpenAIAdapter extends LLMAdapter {
  private apiKey: string;
  private endpoint: string = 'https://api.openai.com/v1/chat/completions';
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
  }
  
  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse> {
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
    return this.normalizeResponse(data) as ClassifyResponse;
  }
  
  calculateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1_000_000) * 10.00 + (outputTokens / 1_000_000) * 30.00;
  }
  
  normalizeResponse(rawResponse: any): StandardResponse {
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
  
  // Implement analyze, enhance as needed...
}

// Unified LLM Service
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
    return error.message.includes('429') || 
           error.message.includes('503') || 
           error.message.includes('timeout');
  }
  
  getCostEstimate(inputTokens: number, outputTokens: number): number {
    return this.adapter.calculateCost(inputTokens, outputTokens);
  }
}

// Factory
export function createLLMService(): LLMService {
  const provider = process.env.LLM_PROVIDER || 'xai';
  const fallbackProvider = process.env.LLM_FALLBACK_PROVIDER;
  
  const adapters: { [key: string]: LLMAdapter } = {
    'xai': new XAIAdapter(),
    'openai': new OpenAIAdapter(),
  };
  
  const primaryAdapter = adapters[provider];
  const fallbackAdapter = fallbackProvider ? adapters[fallbackProvider] : undefined;
  
  if (!primaryAdapter) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
  
  return new LLMService(primaryAdapter, fallbackAdapter);
}
Configuration Vars:


LLM_PROVIDER=xai
XAI_MODEL=grok-4-fast-reasoning-20251001
XAI_API_KEY=your_xai_key
LLM_FALLBACK_PROVIDER=openai
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_API_KEY=your_openai_key
Integration Effort: Refactor existing GrokService in Phase 2 (Week 3-4); add OpenAI adapter.

3.1 Document Upload & Parsing System
Requirements:

Endpoint: POST /api/documents/upload – Support DOCX, PDF, TXT, MD; max 10MB; use Multer; temp cleanup.
Parser: Extract text/metadata (pages, words, chars); detect tables/images; section/paragraph structure.
OCR fallback for scanned PDFs via Tesseract if text <50 chars/page.
Language detection (franc lib) for 12+ langs (en, es, fr, de, it, pt, ru, zh, ja, ko, ar); confidence scoring.
Auto-type detection fallback.
Dependencies:


npm install tesseract.js franc pdf-to-img multer
Expected Response Schema:


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
Code Implementation (Parser Service):


// In DocumentParser service
import fs from 'fs';
import pdfParse from 'pdf-parse';
const { createWorker } = require('tesseract.js');
const franc = require('franc');

private async parsePDFWithOCR(filePath: string): Promise<ParsedDocument> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  
  const isScanned = data.text.trim().length < (data.numpages * 50);
  
  let finalText = data.text;
  let ocrApplied = false;
  
  if (isScanned) {
    try {
      const worker = await createWorker('eng');
      // OCR each page (use pdf-to-image lib for full impl)
      const ocrText = await worker.recognize(/* image data */);
      finalText = ocrText.data.text;
      ocrApplied = true;
      await worker.terminate();
    } catch (error) {
      console.error('OCR failed:', error);
    }
  }
  
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
  const lang = franc(text.substring(0, 1000));
  const langMap = {
    'eng': 'en', 'spa': 'es', 'fra': 'fr', 'deu': 'de',
    'ita': 'it', 'por': 'pt', 'rus': 'ru', 'zho': 'zh',
    'jpn': 'ja', 'kor': 'ko', 'ara': 'ar'
  };
  
  return {
    language: langMap[lang] || 'en',
    confidence: 0.95,
    allLanguages: [langMap[lang] || 'en']
  };
}
Test Cases (Code-Integrated):

Valid DOCX → Parse metadata.
PDF multi-page → Page count.
Corrupted/oversized/unsupported → Errors.
Concurrent uploads (10+) → Stability.
Special filenames/password PDFs → Handling.
Scanned PDF → OCR.
Multilingual/mixed-lang → Detection.
Low-res/handwritten → Thresholds/non-Latin chars/UTF-8.
3.2 Document Classification System
Requirements:

Endpoint: POST /api/documents/classify – Use Grok; 14+ types; confidence; industry/audience/tone.
Heuristic fallback (no AI cost).
Multilingual: Detect lang first, classify with cultural notes.
Supported Types: Resume/CV, Cover Letter, Business Proposal, Research Paper, Technical Report, Blog Post/Article, Marketing Copy, Email/Correspondence, Whitepaper, Case Study, Business Plan, Grant Proposal, Thesis/Dissertation, Essay/Academic Writing.

Expected Response Schema:


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
Code Implementation:


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
Test Cases:

Resume → "resume" >0.9 conf.
Research paper → Academic tone.
Marketing email → Conversational.
Ambiguous → <0.7 conf, "other".
Spanish/French/mixed-lang → Notes.
2000+ chars → Truncation.
AI vs heuristic → Accuracy.
<3s response.
Arabic/Chinese → UTF-8/non-Latin.
3.3 Document Analysis System
Requirements:

Endpoint: POST /api/documents/analyze – Readability (0-100), clarity, grammar count, sentence complexity, passive %, technical level, strengths/weaknesses (3-5 each), suggestions (5-7).
Heuristic fallback: Sentence length, passive %, complexity cat.
Expected Response Schema:


{
  "readabilityScore": 75,
  "clarityScore": 80,
  "grammarIssues": 12,
  "sentenceComplexity": "moderate",
  "avgSentenceLength": 18,
  "passiveVoicePercentage": 15,
  "technicalLevel": "intermediate",
  "strengths": ["Clear structure...", "Effective use...", "Professional tone..."],
  "weaknesses": ["Some passive...", "Occasional run-on...", "Repetitive phrasing..."],
  "suggestions": ["Break up sentences...", "Convert passive...", "Vary structure...", "Remove redundants...", "Strengthen conclusion..."]
}
Test Cases:

Well-written proposal → >75 readability.
Poor text → Error count.
Technical doc → "advanced".
Simple blog → "basic/intermediate".
Quick vs AI → Accuracy.
5000+ words → <5s.
All fields present.
Single sentence edge.
3.4 Document Enhancement System
Requirements:

Endpoint: POST /api/documents/enhance – Levels: Quick ($5, <10s, 3K tokens, temp 0.3), Pro ($15, <15s, 5K, temp 0.5), Premium ($30, <25s, 8K, temp 0.7).
Industry/audience/tone/special instructions.
Track changes, before/after analysis.
Test Cases:

Quick: 500-word with errors → Corrections, readability up, <$0.002.
Pro: 1500-word proposal (SaaS/investors) → Tone/industry, <$0.005.
Premium: 3000-word paper → Restructuring, <$0.010.
Short/long/lists/code/tables → Handling.
Token vs estimates; margins >99%.
Expected Response Schema:


{
  "originalText": "...",
  "enhancedText": "...",
  "changes": [
    {
      "type": "grammar",
      "original": "They was going",
      "enhanced": "They were going",
      "reason": "Subject-verb agreement correction",
      "location": { "start": 150, "end": 165 }
    }
  ],
  "summary": {
    "totalChanges": 47,
    "improvementScore": 68,
    "beforeAnalysis": {},
    "afterAnalysis": {}
  },
  "cost": 0.00234,
  "tokensUsed": 4500,
  "trackChangesHTML": "<div>...</div>"
}
3.5 Specialized Enhancement Endpoints
Requirements:

POST /api/documents/enhance/proposal: Exec summary, value prop, ROI, CTA.
POST /api/documents/enhance/research: Tone, citations, flow.
POST /api/documents/enhance/blog: Hooks, scannability, CTA, SEO.
POST /api/documents/enhance/marketing: Benefits, emotion, power words.
Test Cases: Edge-specific for each (e.g., generic proposal → Summary enhancement).

3.6 Track Changes System & Interactive Editing
Requirements:

Word-level diff; categorize (add/del/mod); locations; HTML highlight.
Endpoint: POST /api/documents/{id}/review-changes – Accept/reject/custom actions; optional re-enhance; return merged text, counts, HTML.
Frontend: Side-by-side viewer with bulk actions, preview, submit.
Redis for session state (1hr TTL); color-coding; tooltips.
Request/Response Schemas:


interface ReviewChangesRequest {
  documentId: string;
  actions: Array<{
    changeId: string;
    action: 'accept' | 'reject' | 'custom';
    customText?: string;
  }>;
  reEnhanceFlow?: boolean;
}

interface ReviewChangesResponse {
  mergedText: string;
  remainingChanges: Change[];
  appliedCount: number;
  rejectedCount: number;
  customCount: number;
  reEnhanceSummary?: { adjustedSections: number; coherenceImprovement: number; };
  trackChangesHTML: string;
  cost: number;
}

interface Change {
  id: string;
  type: 'grammar' | 'style' | 'structure' | 'clarity';
  original: string;
  enhanced: string;
  reason: string;
  location: { start: number; end: number; };
}
Backend Endpoint Code:


router.post('/documents/:id/review-changes', authenticateUser, async (req, res) => {
  const { documentId } = req.params;
  const { actions, reEnhanceFlow } = req.body;
  
  const document = await db('documents').where({ id: documentId, user_id: req.user.userId }).first();
  if (!document) return res.status(404).json({ error: 'Document not found' });
  
  const changes = JSON.parse(document.changes);
  let mergedText = document.original_text;
  let appliedCount = 0, rejectedCount = 0, customCount = 0;
  
  for (const action of actions) {
    const change = changes.find(c => c.id === action.changeId);
    if (!change) continue;
    
    switch (action.action) {
      case 'accept':
        mergedText = applyChange(mergedText, change);
        appliedCount++;
        break;
      case 'reject':
        rejectedCount++;
        break;
      case 'custom':
        mergedText = applyCustomEdit(mergedText, change, action.customText);
        customCount++;
        break;
    }
  }
  
  let reEnhanceSummary, cost = 0;
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
  
  await db('documents').where({ id: documentId }).update({
    enhanced_text: mergedText,
    updated_at: new Date()
  });
  
  const remainingChanges = changes.filter(c => !actions.find(a => a.changeId === c.id));
  const trackChangesHTML = TrackChangesGenerator.generateHTMLComparison(document.original_text, mergedText);
  
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
Frontend Component (React):


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
      body: JSON.stringify({ actions: selectedChanges, reEnhanceFlow: Object.keys(customEdits).length > 0 })
    });
    const result = await response.json();
    // Handle success
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
                <span className="change-reason" title={change.reason}>{change.reason}</span>
              </div>
              
              <div className="change-content">
                <div className="original-text"><del>{change.original}</del></div>
                <div className="enhanced-text"><ins>{change.enhanced}</ins></div>
              </div>
              
              <div className="change-actions">
                <button onClick={() => handleAccept(change.id)}>✓ Accept</button>
                <button onClick={() => handleReject(change.id)}>✗ Reject</button>
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
        <button onClick={submitReview} className="primary">Apply Changes</button>
      </div>
    </div>
  );
}
Test Cases:

Basic: Load 20 changes; accept/reject; merged text.
Custom: Add custom; re-enhance; coherence >80%.
Bulk: Accept/reject all; undo.
Conflicts: Overlapping; sequential.
Preview: Real-time updates.
Mobile: Touch/swipe.
Edge: Empty/single/100+ changes; network interrupt.
Cost: <500 tokens re-enhance.
3.7 Large Document Handling (Chunking Strategy)
Requirements:

Detect >80% context (1.6M tokens); semantic chunk (sections/paragraphs).
Map-reduce: Parallel process, combine with summaries.
RAG for >10 chunks; final coherence pass.
File: /backend/services/document/ChunkingService.ts.
Response Addition:


{
  "chunkInfo": {
    "totalChunks": 4,
    "processed": 4,
    "contextLossRisk": "low",
    "tokensPerChunkAvg": 350000,
    "coherencePassApplied": true
  }
}
Test Cases:

60K words (10 chunks) → Completion.
Cross-chunk >90% flow.
<40s for 5 chunks.
<30% token overhead.
Ultra-large >200K → Split suggestion.
50% fail → Abort.

3.8 User Feedback Loop
Requirements:

Endpoints: POST /api/feedback/{docId} (rating 1-5, reasons JSON, comment, change-specific); GET /api/feedback/stats (admin weekly/monthly).
Anonymized (hashed ID); opt-in shared; <3 rating → re-credit.
Aggregate patterns; prompt refinement; A/B testing.
Schema (SQL):


CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  hashed_user_id VARCHAR(64),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  reasons JSONB,
  comment TEXT,
  change_specific JSONB,
  opt_in_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_doc ON feedback(doc_id);
CREATE INDEX idx_feedback_rating ON feedback(overall_rating);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);
Test Cases:

Rating 2 "Too passive" → Stored; prompt test +15% improvement.
100 simulated → Aggregation.
Reject log → Auto-feedback.
Privacy: No opt-in → Anonymized.
<200ms endpoint.
Response:


{
  "feedbackId": "uuid",
  "acknowledged": true,
  "suggestion": "Thanks! We've noted this for future improvements.",
  "reEnhanceOffered": true,
  "optInReminder": "Consider opting in to help improve the platform!"
}
4.1 API Configuration
Requirements:

Endpoint: https://api.x.ai/v1/chat/completions; model grok-4-fast-reasoning-20251001.
Limits: Tier 1 (10K/day, 100/min); Tier 2 (100K/day, 500/min); burst 2x/60s; 2M tokens/request.
Pricing: $0.20/M input, $0.50/M output.
Env Vars:


XAI_API_KEY=your_api_key_here
XAI_API_ENDPOINT=https://api.x.ai/v1/chat/completions
XAI_MODEL=grok-4-fast-reasoning-20251001
XAI_RATE_LIMIT_TIER=2
XAI_MAX_RETRIES=3
XAI_TIMEOUT_MS=30000
4.2 Grok Integration Testing
Requirements:

Connectivity: Auth, errors (401, timeout).
Rate limiting: Exponential backoff; burst; 90% warnings.
Token counting: ±5% accuracy.
Cost: Formula validation.
Quality: JSON validity, temp variation.
Errors: 429 retry, 500/503 queue.
Code (Rate Limiter & Service):


class GrokRateLimiter {
  private requestCount = 0;
  private dailyCount = 0;
  private lastReset = Date.now();
  private readonly TIER_LIMITS = {
    1: { requestsPerMin: 100, requestsPerDay: 10000 },
    2: { requestsPerMin: 500, requestsPerDay: 100000 }
  };
  
  async executeWithBackoff<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
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
    
    if (Date.now() - this.lastReset > 60000) {
      this.requestCount = 0;
      this.lastReset = Date.now();
    }
    
    if (this.requestCount >= limits.requestsPerMin * 0.9) {
      const waitTime = 60000 - (Date.now() - this.lastReset);
      console.warn(`Approaching rate limit. Waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    
    if (this.dailyCount >= limits.requestsPerDay * 0.95) {
      throw new Error('Daily rate limit approaching. Consider upgrading tier.');
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const rateLimiter = new GrokRateLimiter();

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
Test Scenarios: 1000/5000/10K tokens cost checks; 429/503 handling.

5. Dynamic Prompt Engineering & Advanced AI Features
Requirements:

Industry-adaptive prompts (SaaS, Healthcare, Finance, Legal).
Audience/technical/tone/content focus.
Premium: Tool-use for benchmarking/citations/SEO (e.g., web_search).
Chain-of-Thought for Premium complex docs.
Code (Prompt Builder):


interface PromptContext {
  documentType: string;
  industry?: string;
  audience?: string;
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  tone: string;
  contentFocus?: string[];
}

const INDUSTRY_PROMPTS = {
  'saas': 'Emphasize ROI metrics...',
  'healthcare': 'Maintain HIPAA-compliant...',
  // etc.
};

const TECHNICAL_LEVEL_PROMPTS = {
  'basic': 'Use simple language...',
  // etc.
};

function buildDynamicPrompt(context: PromptContext, level: EnhancementLevel): string {
  const basePrompt = getBasePrompt(context.documentType);
  
  const industryContext = context.industry ? INDUSTRY_PROMPTS[context.industry] : '';
  const audienceContext = context.audience ? `Target Audience: ${context.audience}. Adjust complexity and terminology accordingly.` : '';
  const techContext = TECHNICAL_LEVEL_PROMPTS[context.technicalLevel];
  
  return `${basePrompt}

${industryContext}

${audienceContext}

${techContext}

Focus areas for this document: ${context.contentFocus?.join(', ') || 'general enhancement'}

Enhancement Level: ${level}`;
}
Tool-Use Example (Premium):


const toolConfig = {
  tools: [
    {
      name: "web_search",
      description: "Search for current industry benchmarks...",
      parameters: { query: "industry average [metric] 2025" }
    }
  ],
  tool_choice: "auto"
};
CoT Prompt (Premium):


const premiumPrompt = `
You will enhance this document in multiple reasoning steps:

STEP 1: ANALYSIS - Identify core message...
STEP 2: STRATEGY - Prioritize improvements...
STEP 3: ENHANCEMENT - Apply systematically...
STEP 4: VALIDATION - Check alignment...

Think through each step before providing the enhanced text.
`;
Test Cases:

SaaS/healthcare/legal → Specific emphasis.
Tool-use: Benchmark/citation/SEO integration; <$0.015 cost.
CoT: 3000-word thesis → >Standard quality; +20-30% tokens.
6. Optional Document Templates System
Requirements: Post-MVP; 7+ types (resume, cover letter, proposal, research, blog, marketing, etc.); JSON structures; endpoints for list/get/generate/enhance.

Schemas: Templates table, documents_from_templates, usage_stats.
Optimize prompts with template context; 25% token savings.
UX: Browse/fill/enhance flow.
SQL Schemas:


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

CREATE TABLE documents_from_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  template_id UUID REFERENCES document_templates(id),
  filled_content JSONB,
  generated_text TEXT,
  enhanced_text TEXT,
  enhancement_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE template_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id),
  usage_count INTEGER DEFAULT 0,
  avg_enhancement_time DECIMAL(10,2),
  avg_satisfaction_score DECIMAL(3,2),
  last_used_at TIMESTAMP
);
Example Template JSON (Resume):


{
  "templateId": "resume-modern-professional",
  "type": "resume",
  "structure": [
    {
      "section": "Contact Information",
      "placeholder": "Name | Email | Phone | LinkedIn | Location",
      "required": true
    },
    // ... other sections
  ],
  "defaultTone": "professional",
  "estimatedWords": 400,
  "targetAudience": "hiring_managers"
}
Endpoints Code:


// GET /api/templates
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

// GET /api/templates/:templateId
router.get('/templates/:templateId', authenticateUser, async (req, res) => {
  const template = await db('document_templates')
    .where({ template_id: req.params.templateId, is_active: true })
    .first();
  
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

// POST /api/templates/:templateId/generate
router.post('/templates/:templateId/generate', authenticateUser, async (req, res) => {
  const { templateId } = req.params;
  const { sectionContent } = req.body;
  
  const template = await db('