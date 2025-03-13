// Auto-complete a paragraph
async function autoCompleteParagraph(paragraphText) {
  try {
    console.log('Auto-completing paragraph in letterStore:', paragraphText);
    
    // Get personal information from both cookie and localStorage
    let personalInfo = null;
    
    // Try to get from cookie first
    const personalInfoCookie = Cookies.get('personalInfo');
    if (personalInfoCookie) {
      try {
        personalInfo = JSON.parse(personalInfoCookie);
        console.log('Found personal info in cookies:', personalInfo);
      } catch (e) {
        console.error('Error parsing personal info from cookies:', e);
      }
    }
    
    // If no cookie data, try localStorage
    if (!personalInfo) {
      const localStorageData = localStorage.getItem('personalInfo');
      if (localStorageData) {
        try {
          personalInfo = JSON.parse(localStorageData);
          console.log('Found personal info in localStorage:', personalInfo);
          // Sync to cookie for consistency
          Cookies.set('personalInfo', localStorageData, '1y');
        } catch (e) {
          console.error('Error parsing personal info from localStorage:', e);
        }
      }
    }
    
    const response = await fetch('/api/auto-complete-paragraph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paragraph: paragraphText,
        language: language.value,
        model: model.value,
        personalInfo: personalInfo
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to auto-complete paragraph');
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Auto-complete successful, new paragraph:', data.completion);
      
      // Update the letter content
      setLetterContent(letterContent.value.replace(paragraphText, data.completion));
      
      return data.completion;
    } else {
      console.error('Auto-complete failed:', data.error);
      throw new Error(data.error || 'Failed to auto-complete paragraph');
    }
  } catch (error) {
    console.error('Error in autoCompleteParagraph:', error);
    throw error;
  }
}

// Auto-complete a placeholder
async function autoCompletePlaceholder(context, placeholder) {
  try {
    console.log('Auto-completing placeholder in letterStore:', placeholder);
    
    // Get personal information from both cookie and localStorage
    let personalInfo = null;
    
    // Try to get from cookie first
    const personalInfoCookie = Cookies.get('personalInfo');
    if (personalInfoCookie) {
      try {
        personalInfo = JSON.parse(personalInfoCookie);
        console.log('Found personal info in cookies:', personalInfo);
      } catch (e) {
        console.error('Error parsing personal info from cookies:', e);
      }
    }
    
    // If no cookie data, try localStorage
    if (!personalInfo) {
      const localStorageData = localStorage.getItem('personalInfo');
      if (localStorageData) {
        try {
          personalInfo = JSON.parse(localStorageData);
          console.log('Found personal info in localStorage:', personalInfo);
          // Sync to cookie for consistency
          Cookies.set('personalInfo', localStorageData, '1y');
        } catch (e) {
          console.error('Error parsing personal info from localStorage:', e);
        }
      }
    }
    
    const response = await fetch('/api/auto-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: context,
        placeholder: placeholder,
        language: language.value,
        model: model.value,
        personalInfo: personalInfo
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to auto-complete placeholder');
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('Auto-complete successful, replacement:', data.completion);
      return data.completion;
    } else {
      console.error('Auto-complete failed:', data.error);
      throw new Error(data.error || 'Failed to auto-complete placeholder');
    }
  } catch (error) {
    console.error('Error in autoCompletePlaceholder:', error);
    throw error;
  }
} 