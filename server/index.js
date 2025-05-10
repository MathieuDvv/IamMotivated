require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI clients if keys are available
const anthropic = process.env.CLAUDE_API_KEY ? new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
}) : null;

// Helper function to check API availability
app.get('/api/check-availability', (req, res) => {
  res.json({
    claude: !!process.env.CLAUDE_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY
  });
});

// Helper function to generate letter with Claude
async function generateWithClaude(prompt) {
  if (!anthropic) {
    throw new Error('Claude API key not configured');
  }
  
  try {
    // Use Claude 3.5 Haiku as the primary model with the correct model name
    // According to Anthropic docs: https://docs.anthropic.com/en/docs/about-claude/models
    const primaryModel = 'claude-3-5-haiku-20241022';
    const fallbackModel = 'claude-3-haiku-20240307';
    
    console.log(`Attempting to use ${primaryModel} for generation`);
    
    try {
      const completion = await anthropic.messages.create({
        model: primaryModel,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      
      console.log(`Successfully generated content with ${primaryModel}`);
      return completion.content[0].text;
    } catch (error) {
      // Check for specific error types
      if (error.status === 404 || (error.error && error.error.type === 'invalid_request_error')) {
        console.log(`Model ${primaryModel} not available, trying fallback model ${fallbackModel}`);
        
        const completion = await anthropic.messages.create({
          model: fallbackModel,
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        });
        
        console.log(`Successfully generated content with fallback model ${fallbackModel}`);
        return completion.content[0].text;
      } else {
        // For other errors, provide more detailed logging
        console.error('Error details:', {
          status: error.status,
          type: error.error?.type,
          message: error.message,
          details: error.error
        });
        throw error;
      }
    }
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Provide more specific error messages based on error type
    if (error.status === 401) {
      throw new Error('Authentication error: Invalid API key or unauthorized access');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded: Too many requests to Claude API');
    } else if (error.status === 500) {
      throw new Error('Claude API server error: Please try again later');
    } else {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
}

// Helper function to generate letter with Deepseek
async function generateWithDeepseek(prompt) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('Deepseek API key not configured');
  }
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Deepseek API error:', error);
    throw error;
  }
}

// Generate motivation letter endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const {
      destination,
      goal,
      language,
      additionalInfo,
      model = 'claude',
    } = req.body;

    console.log(`Received generate request: language=${language}, model=${model}`);
    console.log(`Destination: "${destination}", Goal: "${goal}"`);

    // Check if any model is available
    if (!process.env.CLAUDE_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No AI models are available. Please configure at least one API key.'
      });
    }

    // If requested model is not available, try to use an alternative
    let actualModel = model;
    if (model === 'claude' && !process.env.CLAUDE_API_KEY) {
      if (process.env.DEEPSEEK_API_KEY) {
        console.log('Claude API key not configured, falling back to Deepseek');
        actualModel = 'deepseek';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Claude API key not configured and no fallback available'
        });
      }
    } else if (model === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      if (process.env.CLAUDE_API_KEY) {
        console.log('Deepseek API key not configured, falling back to Claude');
        actualModel = 'claude';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Deepseek API key not configured and no fallback available'
        });
      }
    }

    const prompt = `Generate a professional motivation letter in ${language} for ${destination}. 
    Goal: ${goal}
    Additional Information: ${additionalInfo}
    
    Please write a well-structured, formal motivation letter that incorporates the provided information.
    For any information that needs to be filled in by the user, use square brackets with descriptive text inside, like [your current position] or [specific project name].
    Make sure the letter follows the conventions and formalities of ${language === 'fr' ? 'French' : 'English'} business correspondence.
    
    IMPORTANT:
    1. Do not use any markdown formatting. Return plain text only.
    2. Create a clear, descriptive title for the letter that includes the destination name, like "Motivation Letter for ${destination}" or "Application Letter for ${destination}".
    3. Make the title informative and professional.
    4. NEVER include real personal information like real names, addresses, phone numbers, or emails.
    5. For personal information, always use placeholders in square brackets like [your name], [your address], etc.
    6. Do not make up or generate fake personal information - always use placeholders for personal details.`;

    let result;
    try {
      if (actualModel === 'claude') {
        console.log('Using Claude for letter generation');
        result = await generateWithClaude(prompt);
      } else {
        console.log('Using Deepseek for letter generation');
        result = await generateWithDeepseek(prompt);
      }
      console.log(`Letter generation successful, length: ${result.length} characters`);
      res.json({ success: true, letter: result });
    } catch (error) {
      console.error('Error in AI processing:', error);
      if (error.message.includes('API key not configured')) {
        res.status(400).json({ 
          success: false, 
          error: `The selected AI model (${actualModel}) is not available. API key not configured.`
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error generating letter:', error);
    res.status(500).json({ success: false, error: 'Failed to generate letter: ' + error.message });
  }
});

// Modify sentence endpoint
app.post('/api/modify-sentence', async (req, res) => {
  try {
    const { sentence, tone, language = 'en', model = 'claude' } = req.body;
    console.log(`Received modify-sentence request: tone=${tone}, language=${language}, model=${model}`);
    console.log(`Sentence to modify: "${sentence}"`);

    // Check if any model is available
    if (!process.env.CLAUDE_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No AI models are available. Please configure at least one API key.'
      });
    }

    // If requested model is not available, try to use an alternative
    let actualModel = model;
    if (model === 'claude' && !process.env.CLAUDE_API_KEY) {
      if (process.env.DEEPSEEK_API_KEY) {
        console.log('Claude API key not configured, falling back to Deepseek');
        actualModel = 'deepseek';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Claude API key not configured and no fallback available'
        });
      }
    } else if (model === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      if (process.env.CLAUDE_API_KEY) {
        console.log('Deepseek API key not configured, falling back to Claude');
        actualModel = 'claude';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Deepseek API key not configured and no fallback available'
        });
      }
    }

    const prompt = `Rewrite the following ${language === 'fr' ? 'French' : 'English'} sentence in a ${tone} tone while maintaining its core meaning and keeping the same language: "${sentence}"
    
    Important:
    1. Keep any placeholder text in square brackets (e.g., [position name]) unchanged
    2. Maintain the same language as the input (${language === 'fr' ? 'French' : 'English'})
    3. Preserve any formal letter conventions appropriate for the language
    4. Generate THREE different variations of the rewritten sentence
    5. Format your response as a JSON array with three variations, like this:
       ["Variation 1", "Variation 2", "Variation 3"]
    6. Do not use any markdown formatting. Return plain text only.`;

    let result;
    try {
      if (actualModel === 'claude') {
        console.log('Using Claude for modification');
        result = await generateWithClaude(prompt);
      } else {
        console.log('Using Deepseek for modification');
        result = await generateWithDeepseek(prompt);
      }
      console.log(`Modification result: "${result}"`);
      
      // Try to parse the result as JSON
      let variations = [];
      try {
        // Check if the result is already in JSON format
        if (result.trim().startsWith('[') && result.trim().endsWith(']')) {
          variations = JSON.parse(result);
        } else {
          // If not, try to extract variations from the text
          const lines = result.split('\n').filter(line => line.trim());
          if (lines.length >= 3) {
            variations = lines.slice(0, 3).map(line => {
              // Remove any numbering or prefixes
              return line.replace(/^[0-9]+[\.\)]\s*|"Variation [0-9]+"\s*:\s*|"/g, '').trim();
            });
          } else {
            // If we can't extract 3 variations, use the result as the first variation
            // and create slight modifications for the other two
            variations = [
              result.trim(),
              result.trim() + ' Indeed.',
              'In fact, ' + result.trim()
            ];
          }
        }
      } catch (error) {
        console.error('Error parsing variations:', error);
        // Fallback to using the entire result as a single variation
        variations = [result.trim()];
      }
      
      // Ensure we have at least one variation
      if (variations.length === 0) {
        variations = [result.trim()];
      }
      
      res.json({ success: true, variations: variations });
    } catch (error) {
      console.error('Error in AI processing:', error);
      if (error.message.includes('API key not configured')) {
        res.status(400).json({ 
          success: false, 
          error: `The selected AI model (${actualModel}) is not available. API key not configured.`
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error modifying sentence:', error);
    res.status(500).json({ success: false, error: 'Failed to modify sentence: ' + error.message });
  }
});

// Auto-complete placeholder endpoint
app.post('/api/auto-complete', async (req, res) => {
  try {
    const { context, placeholder, language = 'en', model = 'claude', personalInfo = null } = req.body;
    console.log(`Received auto-complete request: language=${language}, model=${model}`);
    console.log(`Context: "${context}"`);
    console.log(`Placeholder: "${placeholder}"`);
    console.log('Personal info received:', personalInfo);

    // Check if any model is available
    if (!process.env.CLAUDE_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No AI models are available. Please configure at least one API key.'
      });
    }

    // If requested model is not available, try to use an alternative
    let actualModel = model;
    if (model === 'claude' && !process.env.CLAUDE_API_KEY) {
      if (process.env.DEEPSEEK_API_KEY) {
        console.log('Claude API key not configured, falling back to Deepseek');
        actualModel = 'deepseek';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Claude API key not configured and no fallback available'
        });
      }
    } else if (model === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      if (process.env.CLAUDE_API_KEY) {
        console.log('Deepseek API key not configured, falling back to Claude');
        actualModel = 'claude';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Deepseek API key not configured and no fallback available'
        });
      }
    }

    // Step 1: Check if the placeholder is for personal information in both English and French
    let result = '';
    const placeholderText = placeholder.replace(/[\[\]]/g, '').toLowerCase();
    
    // Define keywords for personal information in both English and French
    const personalInfoKeywords = {
      name: ['name', 'nom', 'prénom', 'prenom', 'full name', 'nom complet', 'first name', 'prénom', 'last name', 'nom de famille'],
      email: ['email', 'e-mail', 'courriel', 'mail', 'electronic mail', 'courrier électronique', 'adresse email'],
      phone: ['phone', 'telephone', 'téléphone', 'mobile', 'cell', 'cellphone', 'portable', 'numéro', 'numero'],
      address: ['address', 'adresse', 'location', 'lieu', 'domicile', 'residence', 'résidence', 'street', 'rue', 'city', 'ville', 'country', 'pays'],
      education: ['education', 'éducation', 'degree', 'diplôme', 'diplome', 'university', 'université', 'universite', 'school', 'école', 'ecole', 'college', 'collège', 'college', 'formation', 'training', 'bac', 'master', 'phd', 'doctorate'],
      experience: ['experience', 'expérience', 'work', 'travail', 'job', 'emploi', 'career', 'carrière', 'carriere', 'profession', 'occupation', 'position', 'poste', 'role', 'rôle'],
      skills: ['skill', 'skills', 'compétence', 'competence', 'compétences', 'competences', 'ability', 'abilities', 'capacité', 'capacite', 'aptitude', 'expertise', 'knowledge', 'connaissance']
    };
    
    // Handle date placeholders with system date
    if (placeholderText.includes('date') || placeholderText.includes('jour') || placeholderText.includes('mois') || placeholderText.includes('année') || placeholderText.includes('annee')) {
      // Format the current date based on the language
      const today = new Date();
      if (language === 'fr') {
        // French date format: DD/MM/YYYY
        result = today.toLocaleDateString('fr-FR');
      } else {
        // English date format: MM/DD/YYYY
        result = today.toLocaleDateString('en-US');
      }
      console.log('Using system date for date placeholder:', result);
    }
    // Check if we have personal info that matches the placeholder
    else if (personalInfo) {
      // Check each category of personal information
      for (const [infoType, keywords] of Object.entries(personalInfoKeywords)) {
        // If any keyword matches the placeholder text
        if (keywords.some(keyword => placeholderText.includes(keyword))) {
          // Check if we have this information in the personal info
          const infoValue = personalInfo[infoType];
          if (infoValue && infoValue.trim() !== '') {
            console.log(`Using personal ${infoType} information:`, infoValue);
            result = infoValue;
            break;
          }
        }
      }
    }

    // Step 2: If no personal info match was found, use AI to complete
    if (!result) {
      console.log('No personal info match found, using AI to complete the placeholder');
      
      const prompt = `Given the following paragraph from a motivation letter in ${language === 'fr' ? 'French' : 'English'}, 
      complete the placeholder ${placeholder} with appropriate content that fits naturally in the context.
      
      Paragraph: "${context}"
      
      Important:
      1. Your task is ONLY to COMPLETE the placeholder, not to reformulate or modify any existing text
      2. The completion should be concise and appropriate for a formal letter
      3. Maintain the same language as the input (${language === 'fr' ? 'French' : 'English'})
      4. Return ONLY the text that should replace the placeholder, without any explanations or quotes
      5. Do not use any markdown formatting. Return plain text only.
      6. Base your completion on the context of the letter, the company mentioned, and the type of letter
      7. Do not use generic placeholders or default names like "John Doe" or "Jean Dupont"
      8. For placeholders that might request personal information, provide a specific, contextually appropriate completion
      9. NEVER include real personal information like real names, addresses, phone numbers, or emails
      10. If the placeholder is asking for a specific type of information (e.g., skills, experience), provide relevant examples based on the context`;

      try {
        if (actualModel === 'claude') {
          console.log('Using Claude for placeholder completion');
          result = await generateWithClaude(prompt);
        } else {
          console.log('Using Deepseek for placeholder completion');
          result = await generateWithDeepseek(prompt);
        }
        
        // Post-process to remove any default names
        const defaultNames = ['John Doe', 'Jane Doe', 'Jean Dupont', 'Marie Dupont'];
        for (const name of defaultNames) {
          if (result.includes(name)) {
            // Replace with a more specific placeholder based on context
            result = result.replace(name, '[your name]');
          }
        }
        
        console.log('AI completion result:', result);
      } catch (error) {
        console.error('Error in AI processing:', error);
        if (error.message.includes('API key not configured')) {
          res.status(400).json({ 
            success: false, 
            error: `The selected AI model (${actualModel}) is not available. API key not configured.`
          });
          return;
        } else {
          throw error;
        }
      }
    }
    
    console.log(`Auto-complete final result: "${result}"`);
    res.json({ success: true, completion: result.trim() });
  } catch (error) {
    console.error('Error auto-completing placeholder:', error);
    res.status(500).json({ success: false, error: 'Failed to auto-complete placeholder: ' + error.message });
  }
});

// Auto-complete paragraph endpoint
app.post('/api/auto-complete-paragraph', async (req, res) => {
  try {
    const { paragraph, language = 'en', model = 'claude', personalInfo = null } = req.body;
    console.log(`Received auto-complete paragraph request: language=${language}, model=${model}`);
    console.log(`Paragraph: "${paragraph}"`);
    console.log('Personal info received:', personalInfo);

    // Check if any model is available
    if (!process.env.CLAUDE_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No AI models are available. Please configure at least one API key.'
      });
    }

    // If requested model is not available, try to use an alternative
    let actualModel = model;
    if (model === 'claude' && !process.env.CLAUDE_API_KEY) {
      if (process.env.DEEPSEEK_API_KEY) {
        console.log('Claude API key not configured, falling back to Deepseek');
        actualModel = 'deepseek';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Claude API key not configured and no fallback available'
        });
      }
    } else if (model === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      if (process.env.CLAUDE_API_KEY) {
        console.log('Deepseek API key not configured, falling back to Claude');
        actualModel = 'claude';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Deepseek API key not configured and no fallback available'
        });
      }
    }

    // Create a prompt for the AI to complete the paragraph
    const prompt = `Given the following paragraph from a motivation letter in ${language === 'fr' ? 'French' : 'English'}, 
    please improve and complete it in a meaningful way.
    
    Paragraph: "${paragraph}"
    
    Important:
    1. Maintain the same language as the input (${language === 'fr' ? 'French' : 'English'})
    2. Keep the same tone and style as the original paragraph
    3. Return ONLY the completed paragraph, without any explanations or quotes
    4. Do not use any markdown formatting. Return plain text only.
    5. Base your completion on the context of the paragraph, the company mentioned, and the type of letter
    6. Do not use generic placeholders or default names like "John Doe" or "Jean Dupont"
    7. For any personal information, use appropriate placeholders in square brackets like [Your Name] or [Your Experience]
    8. NEVER include real personal information like real names, addresses, phone numbers, or emails`;

    let result = '';
    try {
      if (actualModel === 'claude') {
        console.log('Using Claude for paragraph completion');
        result = await generateWithClaude(prompt);
      } else {
        console.log('Using Deepseek for paragraph completion');
        result = await generateWithDeepseek(prompt);
      }
      
      // Post-process to remove any default names
      const defaultNames = ['John Doe', 'Jane Doe', 'Jean Dupont', 'Marie Dupont'];
      for (const name of defaultNames) {
        if (result.includes(name)) {
          // Replace with a more specific placeholder based on context
          result = result.replace(name, '[your name]');
        }
      }
      
      console.log('AI paragraph completion result:', result);
    } catch (error) {
      console.error('Error in AI processing:', error);
      if (error.message.includes('API key not configured')) {
        res.status(400).json({ 
          success: false, 
          error: `The selected AI model (${actualModel}) is not available. API key not configured.`
        });
        return;
      } else {
        throw error;
      }
    }
    
    console.log(`Auto-complete paragraph final result: "${result}"`);
    res.json({ success: true, completion: result.trim() });
  } catch (error) {
    console.error('Error auto-completing paragraph:', error);
    res.status(500).json({ success: false, error: 'Failed to auto-complete paragraph: ' + error.message });
  }
});

// Make paragraph concise endpoint
app.post('/api/make-concise', async (req, res) => {
  try {
    const { paragraph, language = 'en', model = 'claude', personalInfo = null } = req.body;
    console.log(`Received make-concise request: language=${language}, model=${model}`);
    console.log(`Paragraph to make concise: "${paragraph}"`);
    console.log('Personal info received:', personalInfo);

    // Check if any model is available
    if (!process.env.CLAUDE_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'No AI models are available. Please configure at least one API key.'
      });
    }

    // If requested model is not available, try to use an alternative
    let actualModel = model;
    if (model === 'claude' && !process.env.CLAUDE_API_KEY) {
      if (process.env.DEEPSEEK_API_KEY) {
        console.log('Claude API key not configured, falling back to Deepseek');
        actualModel = 'deepseek';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Claude API key not configured and no fallback available'
        });
      }
    } else if (model === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      if (process.env.CLAUDE_API_KEY) {
        console.log('Deepseek API key not configured, falling back to Claude');
        actualModel = 'claude';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Deepseek API key not configured and no fallback available'
        });
      }
    }

    // First, check if the paragraph contains placeholders
    const placeholderRegex = /\[(.*?)\]/g;
    const placeholders = paragraph.match(placeholderRegex) || [];
    
    // If there are placeholders, replace them with personal info if available
    let modifiedParagraph = paragraph;
    
    if (placeholders.length > 0 && personalInfo) {
      console.log('Found placeholders:', placeholders);
      
      for (const placeholder of placeholders) {
        const placeholderLower = placeholder.toLowerCase();
        let replacement = null;
        
        // Handle date placeholders with system date
        if (placeholderLower.includes('date')) {
          // Format the current date based on the language
          const today = new Date();
          if (language === 'fr') {
            // French date format: DD/MM/YYYY
            replacement = today.toLocaleDateString('fr-FR');
          } else {
            // English date format: MM/DD/YYYY
            replacement = today.toLocaleDateString('en-US');
          }
          console.log('Using system date for date placeholder:', replacement);
        }
        // Use personal info for other placeholders
        else if (placeholderLower.includes('name') && personalInfo.fullName && personalInfo.fullName.trim() !== '') {
          replacement = personalInfo.fullName;
        } else if (placeholderLower.includes('email') && personalInfo.email && personalInfo.email.trim() !== '') {
          replacement = personalInfo.email;
        } else if (placeholderLower.includes('phone') && personalInfo.phone && personalInfo.phone.trim() !== '') {
          replacement = personalInfo.phone;
        } else if (placeholderLower.includes('address') && personalInfo.address && personalInfo.address.trim() !== '') {
          replacement = personalInfo.address;
        } else if ((placeholderLower.includes('education') || placeholderLower.includes('degree') || 
                   placeholderLower.includes('university') || placeholderLower.includes('school')) && 
                   personalInfo.education && personalInfo.education.trim() !== '') {
          replacement = personalInfo.education;
        } else if ((placeholderLower.includes('experience') || placeholderLower.includes('work') || 
                   placeholderLower.includes('job') || placeholderLower.includes('career')) && 
                   personalInfo.experience && personalInfo.experience.trim() !== '') {
          replacement = personalInfo.experience;
        } else if ((placeholderLower.includes('skill') || placeholderLower.includes('ability') || 
                   placeholderLower.includes('competence')) && personalInfo.skills && personalInfo.skills.trim() !== '') {
          replacement = personalInfo.skills;
        }
        
        // Replace the placeholder if we found a match
        if (replacement) {
          console.log(`Replacing placeholder ${placeholder} with: ${replacement}`);
          modifiedParagraph = modifiedParagraph.replace(placeholder, replacement);
        }
      }
    }

    const prompt = `Make the following paragraph from a motivation letter more concise while preserving its key points and meaning:
    
    Paragraph: "${modifiedParagraph}"
    
    Important:
    1. Reduce the length by removing unnecessary words and phrases
    2. Maintain the same language as the input (${language === 'fr' ? 'French' : 'English'})
    3. Preserve any placeholder text in square brackets (e.g., [position name])
    4. Return only the concise version, without any explanations
    5. Do not use any markdown formatting. Return plain text only.
    6. NEVER use default names like "John Doe", "Jean Dupont", or any other generic names.
    7. NEVER replace existing placeholders in square brackets - keep them exactly as they are.
    8. DO NOT INVENT specific details - use placeholders instead.`;

    let result;
    try {
      if (actualModel === 'claude') {
        console.log('Using Claude for making concise');
        result = await generateWithClaude(prompt);
      } else {
        console.log('Using Deepseek for making concise');
        result = await generateWithDeepseek(prompt);
      }
      
      // Post-process the result to ensure no default names are used
      const defaultNames = ['John Doe', 'Jane Doe', 'Jean Dupont', 'Marie Dupont'];
      let processedResult = result.trim();
      
      for (const name of defaultNames) {
        if (processedResult.includes(name)) {
          processedResult = processedResult.replace(name, '[your name]');
        }
      }
      
      console.log(`Concise result: "${processedResult}"`);
      res.json({ success: true, conciseVersion: processedResult });
    } catch (error) {
      console.error('Error in AI processing:', error);
      if (error.message.includes('API key not configured')) {
        res.status(400).json({ 
          success: false, 
          error: `The selected AI model (${actualModel}) is not available. API key not configured.`
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error making paragraph concise:', error);
    res.status(500).json({ success: false, error: 'Failed to make paragraph concise: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Available AI models:');
  console.log('- Claude:', !!process.env.CLAUDE_API_KEY);
  console.log('- Deepseek:', !!process.env.DEEPSEEK_API_KEY);
}); 