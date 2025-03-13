import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

export const useLetterStore = defineStore('letter', () => {
  const letter = ref('')
  const letterHistory = ref([])
  const paragraphVariations = ref({}) // Store variations for each paragraph
  const currentVariationIndex = ref({}) // Track which variation is currently displayed for each paragraph
  const model = ref('claude') // Default model
  
  const paragraphs = computed(() => letter.value.split('\n\n').filter(p => p.trim()))

  // Set the current model
  const setModel = (modelName) => {
    model.value = modelName
  }

  const setLetter = (newLetter) => {
    // Remove any markdown formatting
    const plainTextLetter = newLetter.replace(/[*_~`#]/g, '')
    letter.value = plainTextLetter
    
    // Reset variations when setting a new letter
    paragraphVariations.value = {}
    currentVariationIndex.value = {}
    
    // Generate a better title based on the destination and purpose
    // Extract meaningful information from the first paragraph
    const firstParagraph = plainTextLetter.split('\n\n')[0] || ''
    let title = ''
    
    // Look for company/school name in the first paragraph
    const companyMatch = firstParagraph.match(/(?:to|for|at)\s+([A-Z][A-Za-z\s&]+?)(?:\.|\,|\s+[a-z])/i)
    if (companyMatch && companyMatch[1]) {
      // Limit to max 4 words
      const companyWords = companyMatch[1].trim().split(/\s+/).slice(0, 4)
      title = `Letter for ${companyWords.join(' ')}`
      if (title.length > 30) {
        title = title.substring(0, 30) + '...'
      }
    } else {
      // If no company found, use the first 3-4 words
      const words = firstParagraph.split(/\s+/).slice(0, 4)
      title = words.join(' ')
      if (title.length > 30) {
        title = title.substring(0, 30) + '...'
      }
    }
    
    // Add to history with timestamp
    letterHistory.value.unshift({
      id: Date.now(),
      title,
      preview: plainTextLetter.substring(0, 150) + (plainTextLetter.length > 150 ? '...' : ''),
      content: plainTextLetter,
      date: new Date().toLocaleString()
    })
    
    // Limit history to 10 items
    if (letterHistory.value.length > 10) {
      letterHistory.value.pop()
    }
    
    // Save to localStorage
    saveHistoryToLocalStorage()
  }
  
  // Set letter content without adding to history
  const setLetterContent = (newContent) => {
    // Remove any markdown formatting
    const plainTextLetter = newContent.replace(/[*_~`#]/g, '')
    letter.value = plainTextLetter
    
    // Reset variations when setting a new letter
    paragraphVariations.value = {}
    currentVariationIndex.value = {}
  }
  
  const loadLetterFromHistory = (id) => {
    const historyItem = letterHistory.value.find(item => item.id === id)
    if (historyItem) {
      letter.value = historyItem.content
      // Reset variations when loading from history
      paragraphVariations.value = {}
      currentVariationIndex.value = {}
    }
  }
  
  const removeFromHistory = (id) => {
    letterHistory.value = letterHistory.value.filter(item => item.id !== id)
    saveHistoryToLocalStorage()
  }
  
  const saveHistoryToLocalStorage = () => {
    localStorage.setItem('letterHistory', JSON.stringify(letterHistory.value))
  }
  
  const loadHistoryFromLocalStorage = () => {
    const savedHistory = localStorage.getItem('letterHistory')
    if (savedHistory) {
      letterHistory.value = JSON.parse(savedHistory)
    }
  }
  
  // Load history from localStorage on initialization
  loadHistoryFromLocalStorage()

  const modifySentence = async (paragraphIndex, tone, language = 'en', personalInfo = null) => {
    try {
      console.log(`Store: Modifying sentence with tone ${tone}, language ${language}`)
      console.log('Paragraph to modify:', paragraphs.value[paragraphIndex])
      
      const response = await axios.post('http://localhost:3000/api/modify-sentence', {
        sentence: paragraphs.value[paragraphIndex],
        tone,
        language,
        model: 'deepseek',
        personalInfo
      })
      
      console.log('API response:', response.data)
      
      if (response.data.variations && response.data.variations.length > 0) {
        // Store all variations
        paragraphVariations.value[paragraphIndex] = response.data.variations
        // Set current variation index to 0 (first variation)
        currentVariationIndex.value[paragraphIndex] = 0
        
        // Update the paragraph with the first variation
        const newParagraphs = [...paragraphs.value]
        newParagraphs[paragraphIndex] = response.data.variations[0]
        letter.value = newParagraphs.join('\n\n')
        
        return response.data.variations[0]
      } else {
        console.error('No variations returned from API')
        throw new Error('No variations returned from API')
      }
    } catch (error) {
      console.error('Error modifying sentence:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      throw error
    }
  }

  // Function to cycle to the next variation for a paragraph
  const nextVariation = (paragraphIndex) => {
    if (!paragraphVariations.value[paragraphIndex] || 
        paragraphVariations.value[paragraphIndex].length <= 1) {
      return false // No variations or only one variation
    }
    
    const variations = paragraphVariations.value[paragraphIndex]
    let currentIndex = currentVariationIndex.value[paragraphIndex] || 0
    
    // Calculate next index (cycle back to 0 if at the end)
    const nextIndex = (currentIndex + 1) % variations.length
    currentVariationIndex.value[paragraphIndex] = nextIndex
    
    // Update the paragraph with the new variation
    const newParagraphs = [...paragraphs.value]
    newParagraphs[paragraphIndex] = variations[nextIndex]
    letter.value = newParagraphs.join('\n\n')
    
    return true
  }
  
  // Function to cycle to the previous variation for a paragraph
  const prevVariation = (paragraphIndex) => {
    if (!paragraphVariations.value[paragraphIndex] || 
        paragraphVariations.value[paragraphIndex].length <= 1) {
      return false // No variations or only one variation
    }
    
    const variations = paragraphVariations.value[paragraphIndex]
    let currentIndex = currentVariationIndex.value[paragraphIndex] || 0
    
    // Calculate previous index (cycle to the end if at the beginning)
    const prevIndex = (currentIndex - 1 + variations.length) % variations.length
    currentVariationIndex.value[paragraphIndex] = prevIndex
    
    // Update the paragraph with the new variation
    const newParagraphs = [...paragraphs.value]
    newParagraphs[paragraphIndex] = variations[prevIndex]
    letter.value = newParagraphs.join('\n\n')
    
    return true
  }
  
  // Function to check if a paragraph has variations
  const hasVariations = (paragraphIndex) => {
    return !!paragraphVariations.value[paragraphIndex] && 
           paragraphVariations.value[paragraphIndex].length > 1
  }
  
  // Function to get the current variation index for a paragraph
  const getCurrentVariationIndex = (paragraphIndex) => {
    return currentVariationIndex.value[paragraphIndex] || 0
  }
  
  // Function to get the total number of variations for a paragraph
  const getVariationCount = (paragraphIndex) => {
    return paragraphVariations.value[paragraphIndex]?.length || 1
  }

  const replacePlaceholder = async (paragraphIndex, placeholder, newValue) => {
    const newParagraphs = [...paragraphs.value]
    newParagraphs[paragraphIndex] = newParagraphs[paragraphIndex].replace(placeholder, newValue)
    letter.value = newParagraphs.join('\n\n')
    
    // Clear variations for this paragraph since it's been manually edited
    delete paragraphVariations.value[paragraphIndex]
    delete currentVariationIndex.value[paragraphIndex]
  }

  // Update a specific paragraph
  const updateParagraph = (paragraphIndex, newContent) => {
    const newParagraphs = [...paragraphs.value]
    newParagraphs[paragraphIndex] = newContent
    letter.value = newParagraphs.join('\n\n')
    
    // Clear variations for this paragraph since it's been manually edited
    delete paragraphVariations.value[paragraphIndex]
    delete currentVariationIndex.value[paragraphIndex]
  }

  const autoCompletePlaceholder = async (paragraphIndex, placeholder, language = 'en', personalInfo = null) => {
    try {
      console.log(`Store: Auto-completing placeholder with language ${language}`)
      console.log('Context:', paragraphs.value[paragraphIndex])
      console.log('Placeholder:', placeholder)
      
      const response = await axios.post('http://localhost:3000/api/auto-complete', {
        context: paragraphs.value[paragraphIndex],
        placeholder,
        language,
        model: 'deepseek',
        personalInfo
      })
      
      console.log('API response:', response.data)
      
      if (response.data.completion) {
        const newParagraphs = [...paragraphs.value]
        newParagraphs[paragraphIndex] = newParagraphs[paragraphIndex].replace(
          placeholder, 
          response.data.completion
        )
        letter.value = newParagraphs.join('\n\n')
        
        // Clear variations for this paragraph since it's been modified
        delete paragraphVariations.value[paragraphIndex]
        delete currentVariationIndex.value[paragraphIndex]
        
        return response.data.completion
      } else {
        console.error('No completion returned from API')
        throw new Error('No completion returned from API')
      }
    } catch (error) {
      console.error('Error auto-completing placeholder:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      throw error
    }
  }

  const autoCompleteParagraph = async (paragraphIndex, language = 'en', personalInfo = null) => {
    try {
      console.log(`Store: Auto-completing paragraph with language ${language}`)
      console.log('Paragraph:', paragraphs.value[paragraphIndex])
      
      const response = await axios.post('http://localhost:3000/api/auto-complete-paragraph', {
        paragraph: paragraphs.value[paragraphIndex],
        language,
        model: 'deepseek',
        personalInfo
      })
      
      console.log('API response:', response.data)
      
      if (response.data.completion) {
        const newParagraphs = [...paragraphs.value]
        newParagraphs[paragraphIndex] = response.data.completion
        letter.value = newParagraphs.join('\n\n')
        
        // Clear variations for this paragraph since it's been modified
        delete paragraphVariations.value[paragraphIndex]
        delete currentVariationIndex.value[paragraphIndex]
        
        return response.data.completion
      } else {
        console.error('No completion returned from API')
        throw new Error('No completion returned from API')
      }
    } catch (error) {
      console.error('Error auto-completing paragraph:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      throw error
    }
  }

  const makeConcise = async (paragraphIndex, language = 'en', personalInfo = null) => {
    try {
      console.log(`Store: Making paragraph concise, language ${language}`)
      console.log('Paragraph to make concise:', paragraphs.value[paragraphIndex])
      
      const response = await axios.post('http://localhost:3000/api/make-concise', {
        paragraph: paragraphs.value[paragraphIndex],
        language,
        model: 'deepseek',
        personalInfo
      })
      
      console.log('API response:', response.data)
      
      if (response.data.conciseVersion) {
        const newParagraphs = [...paragraphs.value]
        newParagraphs[paragraphIndex] = response.data.conciseVersion
        letter.value = newParagraphs.join('\n\n')
        
        // Clear variations for this paragraph since it's been modified
        delete paragraphVariations.value[paragraphIndex]
        delete currentVariationIndex.value[paragraphIndex]
        
        return response.data.conciseVersion
      } else {
        console.error('No concise version returned from API')
        throw new Error('No concise version returned from API')
      }
    } catch (error) {
      console.error('Error making paragraph concise:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      throw error
    }
  }

  const copyToClipboard = () => {
    return navigator.clipboard.writeText(letter.value)
      .then(() => {
        return { success: true }
      })
      .catch((error) => {
        console.error('Failed to copy to clipboard:', error)
        return { success: false, error }
      })
  }

  const downloadPDF = (elementRef) => {
    try {
      if (!elementRef) {
        console.error('No element reference provided for PDF generation')
        return { success: false, error: 'No element reference provided' }
      }

      const letterTitle = letterHistory.value.length > 0 ? letterHistory.value[0].title : 'Motivation_Letter'
      const filename = `${letterTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      
      const options = {
        margin: [15, 15, 15, 15],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      return html2pdf().from(elementRef).set(options).save()
        .then(() => {
          return { success: true }
        })
        .catch((error) => {
          console.error('Failed to generate PDF:', error)
          return { success: false, error }
        })
    } catch (error) {
      console.error('Error in downloadPDF:', error)
      return { success: false, error }
    }
  }

  return {
    letter,
    paragraphs,
    letterHistory,
    model,
    setLetter,
    setLetterContent,
    loadLetterFromHistory,
    removeFromHistory,
    nextVariation,
    prevVariation,
    hasVariations,
    getCurrentVariationIndex,
    getVariationCount,
    modifySentence,
    replacePlaceholder,
    updateParagraph,
    autoCompletePlaceholder,
    autoCompleteParagraph,
    makeConcise,
    copyToClipboard,
    downloadPDF,
    setModel
  }
}) 