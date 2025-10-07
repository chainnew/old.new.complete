import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { documentTemplateService } from '../services/documentTemplateService';

/**
 * Generate technical evidence report
 */
export async function generateTechnicalReport(req: AuthRequest, res: Response) {
  try {
    const reportData = req.body;

    if (!reportData || !reportData.title || !reportData.author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    const latexCode = await documentTemplateService.generateTechnicalReport(reportData);

    res.json({
      success: true,
      latexCode,
      templateType: 'technical-evidence-report',
    });
  } catch (error) {
    console.error('Technical report generation error:', error);
    res.status(500).json({ error: 'Failed to generate technical report' });
  }
}

/**
 * Generate professional letter
 */
export async function generateLetter(req: AuthRequest, res: Response) {
  try {
    const letterData = req.body;

    if (!letterData || !letterData.senderName || !letterData.recipientName) {
      return res.status(400).json({ error: 'Sender and recipient names are required' });
    }

    const latexCode = await documentTemplateService.generateLetter(letterData);

    res.json({
      success: true,
      latexCode,
      templateType: 'professional-letter',
    });
  } catch (error) {
    console.error('Letter generation error:', error);
    res.status(500).json({ error: 'Failed to generate letter' });
  }
}

/**
 * Generate project proposal
 */
export async function generateProposal(req: AuthRequest, res: Response) {
  try {
    const proposalData = req.body;

    if (!proposalData || !proposalData.projectTitle || !proposalData.authorName) {
      return res.status(400).json({ error: 'Project title and author name are required' });
    }

    const latexCode = await documentTemplateService.generateProposal(proposalData);

    res.json({
      success: true,
      latexCode,
      templateType: 'project-proposal',
    });
  } catch (error) {
    console.error('Proposal generation error:', error);
    res.status(500).json({ error: 'Failed to generate proposal' });
  }
}

/**
 * Get available document templates
 */
export async function getDocumentTemplates(req: AuthRequest, res: Response) {
  try {
    const templates = documentTemplateService.getAvailableTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching document templates:', error);
    res.status(500).json({ error: 'Failed to fetch document templates' });
  }
}

export const documentTemplateController = {
  generateTechnicalReport,
  generateLetter,
  generateProposal,
  getDocumentTemplates,
};
