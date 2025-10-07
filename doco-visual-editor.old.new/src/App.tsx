import { useEffect, useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Upload } from 'lucide-react';
import { GlobalToolbar } from './components/toolbar/GlobalToolbar';
import { StatusBar } from './components/toolbar/StatusBar';
import { ChatPanel } from './components/chat/ChatPanel';
import { DocumentView } from './components/editor/DocumentView';
import { VisualCodeView } from './components/editor/VisualCodeView';
import { VisualPreview } from './components/editor/VisualPreview';
import { AppDevView } from './components/dev/AppDevView';
import { useDocumentStore } from './stores/documentStore';
import { useChatStore } from './stores/chatStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { parseFile } from './lib/document-parser';
import { AIService } from './lib/ai-service';
import { VisualGenerator, type TemplateStyle } from './lib/visual-generator';
import { visualExporter, type ExportFormat } from './lib/visual-export';
import { storage } from './lib/storage';

function App() {
  const { document, setContent, setMarkdown, loadDocument, saveStatus } = useDocumentStore();
  const { addMessage, setDocoState, setStreamingMessage, clearStreamingMessage, loadChatHistory, clearMessages } =
    useChatStore();
  const [isDragging, setIsDragging] = useState(false);
  const [enhancesUsed, setEnhancesUsed] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [activeVariant, setActiveVariant] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<'document' | 'dev'>('document');
  const [cachedVariants, setCachedVariants] = useState<{
    1: string | null;
    2: string | null;
    3: string | null;
  }>({
    1: null,
    2: null,
    3: null
  });

  useAutoSave();
  useKeyboardShortcuts();

  useEffect(() => {
    loadDocument();
    loadChatHistory();

    // HARDCODED API KEY (temporary fix - .env not loading)
    const HARDCODED_API_KEY = 'YOUR_XAI_KEY_HERE';

    // ALWAYS use API key from environment if available
    const envApiKey = import.meta.env.VITE_XAI_API_KEY || HARDCODED_API_KEY;
    const storedApiKey = storage.loadApiKey();

    console.log('DEBUG - Env API Key:', envApiKey ? `${envApiKey.substring(0, 10)}...` : 'MISSING');
    console.log('DEBUG - Stored API Key:', storedApiKey ? `${storedApiKey.substring(0, 10)}...` : 'MISSING');

    if (envApiKey) {
      // Always use environment variable if it exists
      if (storedApiKey !== envApiKey) {
        storage.saveApiKey(envApiKey);
        console.log('✅ API key loaded/updated from environment');
      }
    } else {
      console.warn('⚠️ VITE_XAI_API_KEY not found in environment variables!');
      console.warn('Make sure .env file exists and dev server was restarted');
    }

    // Sample resume for testing auto-enhancement
    const sampleResume = `John Doe
Software Engineer

Contact Information
Email: john.doe@email.com
Phone: (123) 456-7890
LinkedIn: linkedin.com/in/johndoe
Location: Seattle, WA

Professional Summary
Experienced software engineer with 5+ years in full-stack development. Skilled in JavaScript, React, Node.js, and cloud technologies. Passionate about building scalable applications and improving user experience.

Work Experience
Senior Software Engineer
Tech Corp, Seattle, WA
June 2020 - Present
- Developed and maintained web applications using React and Node.js
- Led a team of 3 developers in agile environment
- Implemented CI/CD pipelines reducing deployment time by 40%
- Collaborated with product managers to define technical requirements

Software Engineer
Startup Inc, Remote
January 2018 - May 2020
- Built RESTful APIs using Express.js and MongoDB
- Optimized database queries improving performance by 60%
- Integrated third-party services including payment processing
- Conducted code reviews and mentored junior developers

Education
Bachelor of Science in Computer Science
University of Washington, Seattle, WA
Graduated: May 2017
- GPA: 3.8/4.0
- Relevant Coursework: Algorithms, Data Structures, Software Engineering

Skills
Languages: JavaScript, TypeScript, Python, Java
Frameworks: React, Node.js, Express, Django
Databases: MongoDB, PostgreSQL, MySQL
Tools: Git, Docker, AWS, Jenkins
Soft Skills: Team Leadership, Problem Solving, Communication

Projects
Personal Finance App
- Full-stack application for budget tracking
- Technologies: React, Node.js, MongoDB
- Features: Real-time data visualization, expense categorization

Certifications
AWS Certified Developer - Associate (2022)
`;

    // Check if a document was uploaded from the main app
    let documentText = localStorage.getItem('currentDocumentText');
    let documentTitle = localStorage.getItem('currentDocumentTitle');
    const documentId = localStorage.getItem('currentDocumentId');
    const uploadedAt = localStorage.getItem('documentUploadedAt');

    // If no uploaded document, load sample for testing
    if (!documentText || !documentTitle) {
      documentText = sampleResume;
      documentTitle = 'Sample Resume - John Doe';
      console.log('🔧 Loaded sample resume for testing auto-enhancement');
    } else {
      console.log('📄 Loaded uploaded document:', documentTitle);
    }

    // Clear any existing chat messages for fresh start - FORCE CLEAR EVERYTHING
    localStorage.removeItem('chat-messages');
    localStorage.removeItem('document-store');
    clearMessages();

    setContent(documentText);
    setMarkdown(documentText);

    // Clear the upload data after loading
    localStorage.removeItem('currentDocumentText');
    localStorage.removeItem('currentDocumentTitle');
    localStorage.removeItem('documentUploadedAt');
    // Keep documentId in case we need it for API calls
    if (documentId) {
      sessionStorage.setItem('activeDocumentId', documentId);
    }
    localStorage.removeItem('currentDocumentId');

    // Auto-trigger enhancement and LaTeX formatting
    setTimeout(() => {
      handleAutoEnhance(documentText, documentTitle);
    }, 800);
  }, []);

  const handleAutoEnhance = async (text: string, title?: string) => {
    setDocoState('thinking');

    // HARDCODED API KEY (temporary fix - .env not loading)
    const HARDCODED_API_KEY = 'YOUR_XAI_KEY_HERE';

    // Force load API key from environment
    const envApiKey = import.meta.env.VITE_XAI_API_KEY || HARDCODED_API_KEY;
    let apiKey = storage.loadApiKey();

    // If no key in storage but env has it, force save and use
    if (!apiKey && envApiKey) {
      storage.saveApiKey(envApiKey);
      apiKey = envApiKey;
      console.log('✅ API key loaded from environment');
    }

    if (!apiKey) {
      console.error('❌ NO API KEY AVAILABLE - Check .env file and restart server');
      addMessage('assistant', '❌ API key not found. Check .env file and restart dev server.');
      setDocoState('idle');
      return;
    }

    const docName = title || 'your document';
    addMessage('assistant', `🚀 Starting AI enhancement for **${docName}**...\n\nUsing xAI Grok with HTML/CSS, Mermaid diagrams, and SVG rendering.`);

    const aiService = new AIService(apiKey);
    const visualGenerator = new VisualGenerator(apiKey);

    try {
      // Step 1: Generate all 3 visual variants and cycle through them
      addMessage('assistant', '📝 **Step 1:** Generating 3 professional HTML/CSS variants...');

      // Clear markdown first
      setMarkdown('');

      const variants: Array<{ id: TemplateStyle; name: string; num: 1 | 2 | 3 }> = [
        { id: 'modern-blue', name: 'Modern Blue', num: 1 },
        { id: 'minimal-gray', name: 'Minimal Gray', num: 2 },
        { id: 'creative-teal', name: 'Creative Teal', num: 3 }
      ];

      // Generate all variants and cache them
      const generatedVariants: { 1: string; 2: string; 3: string } = { 1: '', 2: '', 3: '' };

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];

        // Switch to this variant
        setActiveVariant(variant.num);
        addMessage('assistant', `🎨 Generating **Variant #${variant.num}: ${variant.name}**...`);

        // Generate visual document (HTML/CSS or Mermaid)
        const visualDoc = await visualGenerator.generateFromText(text, variant.id);
        const code = visualDoc.html || visualDoc.svg || '';

        // Cache this variant
        generatedVariants[variant.num] = code;

        // Stream HTML/SVG to the code editor
        let buffer = '';
        let currentIndex = 0;
        const chunkSize = 100;

        const streamCode = () => {
          if (currentIndex < code.length) {
            const chunk = code.substring(currentIndex, currentIndex + chunkSize);
            buffer += chunk;
            setMarkdown(buffer);
            currentIndex += chunkSize;
            setTimeout(streamCode, 8);
          }
        };
        streamCode();

        // Wait for streaming to complete
        await new Promise(resolve => setTimeout(resolve, (code.length / chunkSize) * 8 + 200));

        addMessage('assistant', `✅ **Variant #${variant.num}** complete!`);

        // Pause between variants for visual effect
        if (i < variants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Save all cached variants
      setCachedVariants(generatedVariants);

      addMessage('assistant', '✅ All 3 visual variants generated and cached! Click **Variant #1**, **#2**, or **#3** to switch between them instantly - no regeneration needed!');

      // Step 2: Generate polished HTML for preview
      addMessage('assistant', '🎨 **Step 2:** Creating polished document preview...');

      const polishPrompt = `You are an expert document editor specializing in ${title?.toLowerCase().includes('resume') ? 'resumes and CVs' : 'professional documents'}.

Polish and enhance this document with the following improvements:
- Fix all grammar, spelling, and punctuation errors
- Improve clarity and readability
- Strengthen weak language with powerful action verbs
- Optimize structure and flow
- Make it more professional and impactful
- Keep the original meaning and facts intact

IMPORTANT FORMATTING REQUIREMENTS:
- Use proper HTML formatting with <h1>, <h2>, <h3> for section headings
- Use <p> tags for paragraphs
- Use <strong> for bold text
- Use <ul> and <li> for bullet points
- Add proper spacing between sections
- Make it visually structured and scannable

Document to polish:
${text}

Return ONLY the polished document in HTML format with proper structure. No markdown, no explanations, just clean HTML.`;

      // Clear the document first
      setContent('');

      let polishedText = '';
      let htmlBuffer = '';
      let updateCounter = 0;

      await new Promise<void>((resolve, reject) => {
        aiService.streamChat(
          [{ role: 'user', content: polishPrompt }],
          {
            onChunk: (chunk) => {
              polishedText += chunk;
              htmlBuffer += chunk;
              updateCounter++;

              // Only update every 3 chunks to reduce glitching
              if (updateCounter % 3 === 0 || htmlBuffer.length > 50) {
                setContent(polishedText);
                htmlBuffer = '';
              }
            },
            onComplete: (fullText) => {
              polishedText = fullText.trim();
              setContent(polishedText);
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      setDocoState('idle');

      // Success message
      addMessage('assistant', `✨ **All done!** I've enhanced ${docName} with **3 different styles**!\n\n**What you see:**\n- 📄 **Center**: Your polished document preview\n- 💬 **Left**: Chat with me for changes\n- 🎨 **Top**: Variant buttons to switch styles\n\n**Next steps:**\n- Click **Variant #1**, **#2**, or **#3** to see different document styles\n- Each variant has unique colors and formatting\n- Chat with me to make any adjustments\n- Export to PDF when ready!`);
    } catch (error) {
      console.error('Enhancement error:', error);
      addMessage('assistant', `❌ **Error:** ${(error as Error).message}\n\nPlease check your API key and try again.`);
      clearStreamingMessage();
      setDocoState('error');
      setTimeout(() => setDocoState('idle'), 2000);
    }
  };

  const handleSendMessage = async (message: string) => {
    addMessage('user', message);
    setDocoState('thinking');

    const apiKey = storage.loadApiKey();
    const aiService = new AIService(apiKey || '');

    try {
      if (apiKey) {
        await aiService.streamChat(
          [{ role: 'user', content: message }],
          {
            onChunk: (text) => {
              setStreamingMessage(
                useChatStore.getState().streamingMessage + text
              );
            },
            onComplete: (fullText) => {
              addMessage('assistant', fullText);
              clearStreamingMessage();
              setDocoState('idle');
            },
            onError: (error) => {
              console.error('AI Error:', error);
              addMessage('assistant', 'Sorry, I encountered an error. Please check your API key in settings.');
              clearStreamingMessage();
              setDocoState('error');
              setTimeout(() => setDocoState('idle'), 2000);
            },
          }
        );
      } else {
        await aiService.mockStream(message, {
          onChunk: (text) => {
            setStreamingMessage(
              useChatStore.getState().streamingMessage + text
            );
          },
          onComplete: (fullText) => {
            addMessage('assistant', fullText);
            clearStreamingMessage();
            setDocoState('idle');
          },
          onError: (error) => {
            console.error('AI Error:', error);
            addMessage('assistant', 'Sorry, I encountered an error.');
            clearStreamingMessage();
            setDocoState('error');
            setTimeout(() => setDocoState('idle'), 2000);
          },
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setDocoState('error');
      setTimeout(() => setDocoState('idle'), 2000);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const content = await parseFile(file);
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension for title
      setContent(content);
      setMarkdown(content);
      addMessage('assistant', `Great! I've loaded "${file.name}". Polishing it now...`);
      
      // Auto-trigger enhancement for uploaded files
      setTimeout(() => {
        handleAutoEnhance(content, title);
      }, 500);
    } catch (error) {
      console.error('File upload error:', error);
      addMessage('assistant', `Sorry, I couldn't read that file. Please try a different format.`);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      await exportDocument(document.content, document.title, format);
      addMessage('assistant', `Your document has been exported as ${format.toUpperCase()}! Nice work!`);
    } catch (error) {
      console.error('Export error:', error);
      addMessage('assistant', 'Sorry, there was an error exporting your document.');
    }
  };

  const handleNew = () => {
    setContent('');
    setMarkdown('');
    addMessage('assistant', 'Started a new document. What would you like to create?');
  };

  const handleSave = () => {
    // Auto-save is already handling this, but provide feedback
    addMessage('assistant', 'Your document is saved!');
  };

  const handleEnhance = async (level: 'quick' | 'pro' | 'premium') => {
    const limits = { quick: 5, pro: 20, premium: 100 };
    if (enhancesUsed >= limits.quick) {
      addMessage('assistant', 'You\'ve reached your enhance limit. Upgrade for more!');
      return;
    }
    setEnhancesUsed(enhancesUsed + 1);
    const prompts = {
      quick: 'Please quickly polish this document for grammar and clarity.',
      pro: 'Please provide a professional enhancement with improved structure and flow.',
      premium: 'Please completely transform this document with advanced improvements.',
    };
    handleSendMessage(prompts[level]);
  };

  const handleAnalyze = () => {
    handleSendMessage('Please analyze this document and provide insights on readability, tone, and structure.');
  };

  const handleRecompile = async () => {
    setDocoState('thinking');
    addMessage('assistant', 'Recompiling LaTeX code...');

    const prompt = `Generate professional LaTeX code for this document:

${document.content}

Instructions:
- Use professional LaTeX formatting
- Include proper document class, packages, and styling
- Format sections, subsections appropriately
- Add proper spacing and formatting
- Return ONLY the LaTeX code wrapped in \`\`\`latex code blocks`;

    // Force load API key
    const envApiKey = import.meta.env.VITE_XAI_API_KEY;
    let apiKey = storage.loadApiKey();
    if (!apiKey && envApiKey) {
      storage.saveApiKey(envApiKey);
      apiKey = envApiKey;
    }

    if (!apiKey) {
      addMessage('assistant', '❌ API key not found. Check .env file.');
      setDocoState('idle');
      return;
    }

    const aiService = new AIService(apiKey);

    try {
        await aiService.streamChat(
          [{ role: 'user', content: prompt }],
          {
            onChunk: (chunk) => {
              setStreamingMessage(useChatStore.getState().streamingMessage + chunk);
            },
            onComplete: (fullText) => {
              const latexMatch = fullText.match(/```latex\n([\s\S]*?)\n```/);
              if (latexMatch) {
                setMarkdown(latexMatch[1]);
                addMessage('assistant', 'LaTeX code recompiled! Check the Code tab.');
              } else {
                addMessage('assistant', 'Generated LaTeX code, but format may need adjustment.');
                setMarkdown(fullText);
              }
              clearStreamingMessage();
              setDocoState('idle');
            },
            onError: (error) => {
              console.error('Recompile error:', error);
              addMessage('assistant', 'Error recompiling. Please check your API key.');
              clearStreamingMessage();
              setDocoState('error');
              setTimeout(() => setDocoState('idle'), 2000);
            },
          }
        );
    } catch (error) {
      console.error('Recompile error:', error);
      setDocoState('error');
      setTimeout(() => setDocoState('idle'), 2000);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack([...redoStack, document.content]);
    setUndoStack(undoStack.slice(0, -1));
    setContent(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack([...undoStack, document.content]);
    setRedoStack(redoStack.slice(0, -1));
    setContent(next);
  };

  useEffect(() => {
    if (document.content && undoStack[undoStack.length - 1] !== document.content) {
      setUndoStack([...undoStack, document.content]);
    }
  }, [document.content]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const wordCount = document.content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <GlobalToolbar
        onNew={handleNew}
        onOpen={handleFileUpload}
        onSave={handleSave}
        onExport={handleExport}
        onEnhance={handleEnhance}
        onAnalyze={handleAnalyze}
        onRecompile={handleRecompile}
        onRandomStyle={handleRandomStyle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        userTier="Free"
        saveStatus={saveStatus}
        mode={mode}
        onModeChange={setMode}
      />

      <div className="flex-1 overflow-hidden">
        {mode === 'dev' ? (
          <AppDevView />
        ) : (
          <PanelGroup direction="horizontal">
            {/* Chat Panel - Left Side */}
            <Panel defaultSize={30} minSize={20} maxSize={40}>
              <ChatPanel onSendMessage={handleSendMessage} />
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors" />

            {/* Document Preview - Centered */}
            <Panel defaultSize={70} minSize={50}>
            <div
              className="relative h-full"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="h-full flex flex-col bg-slate-900">
                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-200 font-semibold">Document Preview</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVariantChange(1)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                          activeVariant === 1
                            ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/80 ring-4 ring-blue-400/30 animate-pulse scale-105'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:shadow-lg'
                        }`}
                      >
                        Variant #1
                      </button>
                      <button
                        onClick={() => handleVariantChange(2)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                          activeVariant === 2
                            ? 'bg-gray-700 text-white shadow-2xl shadow-gray-500/80 ring-4 ring-gray-400/30 animate-pulse scale-105'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:shadow-lg'
                        }`}
                      >
                        Variant #2
                      </button>
                      <button
                        onClick={() => handleVariantChange(3)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                          activeVariant === 3
                            ? 'bg-teal-600 text-white shadow-2xl shadow-teal-500/80 ring-4 ring-teal-400/30 animate-pulse scale-105'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:shadow-lg'
                        }`}
                      >
                        Variant #3
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <VisualPreview />
                </div>
              </div>

              {isDragging && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-center">
                    <Upload size={64} className="text-cyan-400 mx-auto mb-4" />
                    <p className="text-slate-200 text-xl font-medium">Drop your document here</p>
                    <p className="text-slate-400 text-sm mt-2">
                      Supports DOCX, PDF, TXT, MD, HTML
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".docx,.pdf,.txt,.md,.markdown,.html"
                onChange={handleFileSelect}
              />
            </div>
          </Panel>
          </PanelGroup>
        )}
      </div>

      <StatusBar
        wordCount={wordCount}
        userTier="Free"
        enhancesUsed={enhancesUsed}
        enhancesLimit={5}
        isOnline={true}
        latency={250}
      />
    </div>
  );
}

  const handleVariantChange = async (variant: 1 | 2 | 3) => {
    setActiveVariant(variant);

    const variantNames = {
      1: 'Modern Blue',
      2: 'Minimal Gray',
      3: 'Creative Teal'
    };

    const templateIds: { [key: number]: TemplateStyle } = {
      1: 'modern-blue',
      2: 'minimal-gray',
      3: 'creative-teal'
    };

    // Check if variant is already cached
    if (cachedVariants[variant]) {
      // Instantly switch to cached variant with smooth animation
      setMarkdown(cachedVariants[variant]!);
      // Don't add message for instant switching - keep it snappy!
      return;
    }

    // If not cached, generate it
    setDocoState('thinking');
    addMessage('assistant', `🎨 Generating **${variantNames[variant]}** variant...`);

    // Force load API key
    const HARDCODED_API_KEY = 'YOUR_XAI_KEY_HERE';
    const envApiKey = import.meta.env.VITE_XAI_API_KEY || HARDCODED_API_KEY;
    let apiKey = storage.loadApiKey();
    if (!apiKey && envApiKey) {
      storage.saveApiKey(envApiKey);
      apiKey = envApiKey;
    }

    if (!apiKey) {
      addMessage('assistant', '❌ API key not found. Check .env file.');
      setDocoState('idle');
      return;
    }

    const visualGenerator = new VisualGenerator(apiKey);

    try {
      const visualDoc = await visualGenerator.generateFromText(document.content, templateIds[variant]);
      const code = visualDoc.html || visualDoc.svg || '';
      setMarkdown(code);

      // Cache this variant
      setCachedVariants(prev => ({
        ...prev,
        [variant]: code
      }));

      addMessage('assistant', `✨ **${variantNames[variant]}** variant generated! Check the visual code in the center panel.`);
      setDocoState('idle');
    } catch (error) {
      console.error('Variant generation error:', error);
      addMessage('assistant', `Error generating variant: ${(error as Error).message}`);
      setDocoState('error');
      setTimeout(() => setDocoState('idle'), 2000);
    }
  };

  const handleRandomStyle = async () => {
    const randomVariant = [1, 2, 3][Math.floor(Math.random() * 3)] as 1 | 2 | 3;
    handleVariantChange(randomVariant);
  };

export default App;
