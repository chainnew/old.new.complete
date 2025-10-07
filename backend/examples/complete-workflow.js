/**
 * Complete Workflow Example
 *
 * This script demonstrates the full document enhancement workflow:
 * 1. Register/Login
 * 2. Upload document
 * 3. Classify & Analyze
 * 4. Enhance
 * 5. Export to multiple formats
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let documentId = '';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
  const headers = {
    'Authorization': authToken ? `Bearer ${authToken}` : '',
  };

  if (!isFormData && data) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = isFormData ? data : JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.buffer();
}

// 1. Register or Login
async function authenticate() {
  console.log('🔐 Authenticating...');

  try {
    // Try to login first
    const response = await apiCall('/auth/login', 'POST', {
      email: 'demo@example.com',
      password: 'demo123',
    });
    authToken = response.token;
    console.log('✅ Logged in successfully');
  } catch (error) {
    // If login fails, register
    console.log('📝 No existing user, registering...');
    const response = await apiCall('/auth/register', 'POST', {
      email: 'demo@example.com',
      password: 'demo123',
      firstName: 'Demo',
      lastName: 'User',
    });
    authToken = response.token;
    console.log('✅ Registered successfully');
  }
}

// 2. Upload Document
async function uploadDocument(filePath) {
  console.log('📤 Uploading document...');

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await apiCall('/documents/upload', 'POST', formData, true);
  documentId = response.documentId;

  console.log('✅ Document uploaded');
  console.log(`   Document ID: ${documentId}`);
  console.log(`   Word count: ${response.metadata.wordCount}`);
  console.log(`   Language: ${response.metadata.detectedLanguage}`);
}

// 3. Classify Document
async function classifyDocument() {
  console.log('🏷️  Classifying document...');

  const response = await apiCall(`/documents/${documentId}/classify`, 'POST');

  console.log('✅ Document classified');
  console.log(`   Type: ${response.type}`);
  console.log(`   Confidence: ${(response.confidence * 100).toFixed(1)}%`);
  console.log(`   Suggested tone: ${response.suggestedTone}`);
}

// 4. Analyze Document
async function analyzeDocument() {
  console.log('📊 Analyzing document...');

  const response = await apiCall(`/documents/${documentId}/analyze`, 'POST');

  console.log('✅ Document analyzed');
  console.log(`   Readability: ${response.readabilityScore}/100`);
  console.log(`   Clarity: ${response.clarityScore}/100`);
  console.log(`   Grammar issues: ${response.grammarIssues}`);
  console.log(`   Sentence complexity: ${response.sentenceComplexity}`);
}

// 5. Enhance Document
async function enhanceDocument(level = 'professional') {
  console.log(`✨ Enhancing document (${level})...`);

  const response = await apiCall(`/documents/${documentId}/enhance`, 'POST', {
    level,
    industry: 'technology',
    audience: 'professionals',
    tone: 'professional',
  });

  console.log('✅ Document enhanced');
  console.log(`   Total changes: ${response.summary?.totalChanges || 0}`);
  console.log(`   Cost: $${response.cost.toFixed(6)}`);
  console.log(`   Tokens used: ${response.tokensUsed}`);

  // Show first few changes
  if (response.changes && response.changes.length > 0) {
    console.log('\n   Sample changes:');
    response.changes.slice(0, 3).forEach((change, i) => {
      console.log(`   ${i + 1}. "${change.original}" → "${change.enhanced}"`);
      console.log(`      Reason: ${change.reason}`);
    });
  }
}

// 6. Export Documents
async function exportDocuments() {
  console.log('📥 Exporting documents...');

  const formats = [
    { format: 'docx', ext: 'docx' },
    { format: 'latex', ext: 'tex' },
    { format: 'html', ext: 'html' },
    { format: 'txt', ext: 'txt' },
  ];

  for (const { format, ext } of formats) {
    const buffer = await apiCall(
      `/documents/${documentId}/export?format=${format}&title=Enhanced%20Document&author=Demo%20User`,
      'GET'
    );

    const outputPath = path.join(__dirname, `output/enhanced.${ext}`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Exported ${format.toUpperCase()}: ${outputPath}`);
  }
}

// Main workflow
async function main() {
  try {
    console.log('🚀 Old.New Complete Workflow Demo\n');

    // Create sample document if it doesn't exist
    const samplePath = path.join(__dirname, 'sample.txt');
    if (!fs.existsSync(samplePath)) {
      const sampleContent = `Introduction to Artificial Intelligence

Artificial intelligence (AI) is revolutionizing how we work and live. It has applications in many fields.

AI systems can process data, learn from patterns, and make decisions. Machine learning is a important subset of AI.

The future of AI is promising. Many companies are investing in AI research and development.

In conclusion, AI will continue to shape our world in the coming years.`;

      fs.writeFileSync(samplePath, sampleContent);
      console.log('📝 Created sample document\n');
    }

    // Run workflow
    await authenticate();
    await uploadDocument(samplePath);
    await classifyDocument();
    await analyzeDocument();
    await enhanceDocument('professional');
    await exportDocuments();

    console.log('\n✅ Workflow complete!');
    console.log('   Check the examples/output/ directory for exported files');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
