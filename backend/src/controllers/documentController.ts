import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { documentParser } from '../services/document/DocumentParser';
import { documentClassifier } from '../services/document/DocumentClassifier';
import { documentAnalyzer } from '../services/document/DocumentAnalyzer';
import { documentEnhancer, EnhancementLevel } from '../services/document/DocumentEnhancer';
import { documentFormatter } from '../services/output/DocumentFormatter';
import { db } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import logger from '../utils/logger';

export class DocumentController {
  /**
   * Upload and parse document
   */
  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user?.userId;
      const filePath = req.file.path;
      const fileFormat = path.extname(req.file.originalname).toLowerCase().replace('.', '');

      // Parse document
      const parsed = await documentParser.parse(filePath, fileFormat);

      // Save to database
      const documentId = uuidv4();
      await db.query(
        `INSERT INTO documents (id, user_id, original_filename, file_path, file_size, file_format, original_text, metadata, structure, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          documentId,
          userId || null,
          req.file.originalname,
          filePath,
          req.file.size,
          fileFormat,
          parsed.text,
          JSON.stringify(parsed.metadata),
          JSON.stringify(parsed.structure),
          'parsed',
        ]
      );

      logger.info('Document uploaded and parsed', { documentId, userId });

      res.json({
        documentId,
        text: parsed.text,
        metadata: parsed.metadata,
        structure: parsed.structure,
      });
    } catch (error) {
      logger.error('Upload failed', { error });
      res.status(500).json({ error: 'Failed to upload and parse document' });
    }
  }

  /**
   * Classify document
   */
  async classify(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;

      // Get document from database
      const result = await db.query(
        'SELECT original_text, metadata FROM documents WHERE id = $1',
        [documentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = result.rows[0];
      const metadata = JSON.parse(document.metadata);

      // Classify document
      const classification = await documentClassifier.classify(
        document.original_text,
        metadata.detectedLanguage
      );

      // Save classification to database
      await db.query(
        `INSERT INTO document_classifications (document_id, type, confidence, subtype, industry, audience, suggested_tone, detected_language, multilingual_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          documentId,
          classification.type,
          classification.confidence,
          classification.subtype || null,
          classification.industry || null,
          classification.audience || null,
          classification.suggestedTone || null,
          classification.detectedLanguage || null,
          classification.multilingualNote || null,
        ]
      );

      // Update document type
      await db.query('UPDATE documents SET document_type = $1, status = $2 WHERE id = $3', [
        classification.type,
        'classified',
        documentId,
      ]);

      logger.info('Document classified', { documentId, type: classification.type });

      res.json(classification);
    } catch (error) {
      logger.error('Classification failed', { error });
      res.status(500).json({ error: 'Failed to classify document' });
    }
  }

  /**
   * Analyze document
   */
  async analyze(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;

      const result = await db.query('SELECT original_text FROM documents WHERE id = $1', [
        documentId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = result.rows[0];

      // Analyze document
      const analysis = await documentAnalyzer.analyze(document.original_text);

      // Save analysis to database
      await db.query(
        `INSERT INTO document_analyses (document_id, readability_score, clarity_score, grammar_issues, sentence_complexity, avg_sentence_length, passive_voice_percentage, technical_level, strengths, weaknesses, suggestions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          documentId,
          analysis.readabilityScore,
          analysis.clarityScore,
          analysis.grammarIssues,
          analysis.sentenceComplexity,
          analysis.avgSentenceLength,
          analysis.passiveVoicePercentage,
          analysis.technicalLevel,
          JSON.stringify(analysis.strengths),
          JSON.stringify(analysis.weaknesses),
          JSON.stringify(analysis.suggestions),
        ]
      );

      logger.info('Document analyzed', { documentId });

      res.json(analysis);
    } catch (error) {
      logger.error('Analysis failed', { error });
      res.status(500).json({ error: 'Failed to analyze document' });
    }
  }

  /**
   * Enhance document
   */
  async enhance(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const { level, industry, audience, tone, specialInstructions } = req.body;

      if (!['quick', 'professional', 'premium'].includes(level)) {
        return res.status(400).json({ error: 'Invalid enhancement level' });
      }

      const result = await db.query(
        'SELECT original_text, document_type FROM documents WHERE id = $1',
        [documentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = result.rows[0];

      // Enhance document
      const enhancement = await documentEnhancer.enhance({
        text: document.original_text,
        level: level as EnhancementLevel,
        documentType: document.document_type,
        industry,
        audience,
        tone,
        specialInstructions,
      });

      // Save enhancement to database
      const enhancementId = uuidv4();
      await db.query(
        `INSERT INTO document_enhancements (id, document_id, enhancement_level, changes, summary, cost, tokens_used, processing_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          enhancementId,
          documentId,
          level,
          JSON.stringify(enhancement.changes || []),
          JSON.stringify(enhancement.summary || {}),
          enhancement.cost,
          enhancement.tokensUsed.total,
          0, // Will be calculated from timestamp
        ]
      );

      // Update document with enhanced text
      await db.query(
        'UPDATE documents SET enhanced_text = $1, status = $2 WHERE id = $3',
        [enhancement.enhancedText, 'enhanced', documentId]
      );

      // Track API usage
      if (req.user) {
        await db.query(
          `INSERT INTO api_usage (user_id, document_id, provider, model, operation, input_tokens, output_tokens, total_tokens, cost)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            req.user.userId,
            documentId,
            enhancement.provider,
            enhancement.model,
            'enhance',
            enhancement.tokensUsed.input,
            enhancement.tokensUsed.output,
            enhancement.tokensUsed.total,
            enhancement.cost,
          ]
        );
      }

      logger.info('Document enhanced', { documentId, level, cost: enhancement.cost });

      res.json({
        enhancementId,
        originalText: document.original_text,
        enhancedText: enhancement.enhancedText,
        changes: enhancement.changes,
        summary: enhancement.summary,
        cost: enhancement.cost,
        tokensUsed: enhancement.tokensUsed,
      });
    } catch (error) {
      logger.error('Enhancement failed', { error });
      res.status(500).json({ error: 'Failed to enhance document' });
    }
  }

  /**
   * Export document in various formats
   */
  async export(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;
      const { format, title, author } = req.query;

      if (!['docx', 'latex', 'html', 'txt'].includes(format as string)) {
        return res.status(400).json({ error: 'Invalid export format' });
      }

      const result = await db.query(
        'SELECT enhanced_text, original_text, document_type FROM documents WHERE id = $1',
        [documentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = result.rows[0];
      const text = document.enhanced_text || document.original_text;

      let output: Buffer | string;
      let filename: string;
      let contentType: string;

      switch (format) {
        case 'docx':
          output = await documentFormatter.generateDocx(text, {
            title: title as string,
            author: author as string,
            documentType: document.document_type,
          });
          filename = `document-${documentId}.docx`;
          contentType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;

        case 'latex':
          output = await documentFormatter.generateLatex(text, {
            title: title as string,
            author: author as string,
            documentType: document.document_type,
          });
          filename = `document-${documentId}.tex`;
          contentType = 'application/x-latex';
          break;

        case 'html':
          output = await documentFormatter.generateHtml(text, {
            title: title as string,
            includeStyles: true,
          });
          filename = `document-${documentId}.html`;
          contentType = 'text/html';
          break;

        case 'txt':
        default:
          output = text;
          filename = `document-${documentId}.txt`;
          contentType = 'text/plain';
          break;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(output);

      logger.info('Document exported', { documentId, format });
    } catch (error) {
      logger.error('Export failed', { error });
      res.status(500).json({ error: 'Failed to export document' });
    }
  }

  /**
   * Get document details
   */
  async getDocument(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;

      const result = await db.query(
        `SELECT d.*,
                dc.type as classification_type, dc.confidence, dc.suggested_tone,
                da.readability_score, da.clarity_score
         FROM documents d
         LEFT JOIN document_classifications dc ON d.id = dc.document_id
         LEFT JOIN document_analyses da ON d.id = da.document_id
         WHERE d.id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = result.rows[0];
      document.metadata = JSON.parse(document.metadata);
      document.structure = JSON.parse(document.structure);

      res.json(document);
    } catch (error) {
      logger.error('Failed to get document', { error });
      res.status(500).json({ error: 'Failed to get document' });
    }
  }

  /**
   * List user's documents
   */
  async listDocuments(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { limit = 20, offset = 0 } = req.query;

      const result = await db.query(
        `SELECT id, original_filename, document_type, status, created_at, updated_at
         FROM documents
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.json({
        documents: result.rows,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      logger.error('Failed to list documents', { error });
      res.status(500).json({ error: 'Failed to list documents' });
    }
  }
}

export const documentController = new DocumentController();
