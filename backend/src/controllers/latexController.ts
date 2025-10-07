import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { latexService } from '../services/latexService';

/**
 * Generate LaTeX resume from data
 */
export async function generateLatex(req: AuthRequest, res: Response) {
  try {
    const { resumeData, styleId } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const style = styleId || 'blue-horizon';
    const latexCode = await latexService.generateResume(resumeData, style);

    res.json({
      success: true,
      latexCode,
      styleId: style,
    });
  } catch (error) {
    console.error('LaTeX generation error:', error);
    res.status(500).json({ error: 'Failed to generate LaTeX' });
  }
}

/**
 * Get available template styles
 */
export async function getStyles(req: AuthRequest, res: Response) {
  try {
    const styles = latexService.getAvailableStyles();
    res.json({ styles });
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
}

export const latexController = {
  generateLatex,
  getStyles,
};
