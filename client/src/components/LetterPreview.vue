<template>
  <div class="h-full flex flex-col" @click="handleClickOutside">
    <div class="flex justify-between items-center h-16 px-6 border-b border-gray-200 bg-[#FFFFFC] shadow-md sticky top-0 z-10">
      <div class="flex items-center">
        <h2 class="text-xl font-semibold text-[#3C3744]">{{ translations[language].preview }}</h2>
        <span v-if="letter && letterStore.model" class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4C5E4] text-[#090C9B]">
          {{ letterStore.model === 'claude' ? 'Claude 3.5 Haiku' : 'Deepseek Coder' }}
        </span>
      </div>
      <div class="flex space-x-3">
        <button @click="copyToClipboard" class="p-2 text-[#090C9B] hover:text-[#3D52D5] transition-colors relative" title="Copy to clipboard">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="{ 'animate-pulse': copyIconAnimating }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="!copySuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button @click="downloadPDF" class="p-2 text-[#090C9B] hover:text-[#3D52D5] transition-colors" title="Download PDF">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="{ 'animate-pulse': pdfIconAnimating }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="!pdfSuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Notification toast -->
    <div 
      v-if="notification.show" 
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300"
      :class="notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
    >
      <div class="flex items-center">
        <svg v-if="notification.type === 'success'" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>{{ notification.message }}</span>
      </div>
    </div>

    <div class="flex-1 flex items-start justify-center p-6 bg-[#736F72] overflow-auto">
      <div v-if="!letter" class="text-center text-[#FFFFFC] opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p class="text-xl">{{ translations[language].emptyState }}</p>
      </div>

      <div v-else class="w-full max-w-4xl" ref="letterContainer">
        <div class="bg-[#FFFFFC] shadow-lg rounded-lg p-8">
          <div v-for="(paragraph, index) in letterParagraphs" :key="index" class="relative group mb-4">
            <!-- Loading skeleton when paragraph is being processed -->
            <div 
              v-if="loadingParagraphIndex === index" 
              class="animate-pulse bg-[#B4C5E4]/30 rounded-lg p-2 h-20"
            >
              <div class="h-2 bg-[#3D52D5]/20 rounded w-3/4 mb-2"></div>
              <div class="h-2 bg-[#3D52D5]/20 rounded w-full mb-2"></div>
              <div class="h-2 bg-[#3D52D5]/20 rounded w-5/6"></div>
            </div>
            
            <!-- Normal paragraph display -->
            <p 
              v-else
              class="text-[#3C3744] p-2 rounded-lg transition-colors group-hover:bg-[#B4C5E4]/10 cursor-pointer"
              @click.stop="handleParagraphClick(index, paragraph)"
            >
              <template v-for="(part, partIndex) in splitParagraphParts(paragraph)" :key="partIndex">
                <span 
                  v-if="isPlaceholder(part)" 
                  class="bg-[#3D52D5]/10 px-2 py-1 rounded cursor-pointer hover:bg-[#3D52D5]/20"
                  @click.stop="handlePlaceholderClick(index, part)"
                >
                  {{ part }}
                </span>
                <span v-else>{{ part }}</span>
              </template>
            </p>
            
            <!-- Combined menu and variation controls -->
            <div v-if="selectedParagraphIndex === index" class="absolute left-1/2 transform -translate-x-1/2 -translate-y-12 flex items-center space-x-5 z-20">
              <!-- Previous variation button -->
              <button 
                v-if="letterStore.hasVariations(index)"
                @click.stop="letterStore.prevVariation(index)"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-[#B4C5E4]/20 transition-colors text-[#090C9B]"
                title="Previous variation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <!-- Menu buttons -->
              <div class="flex space-x-2 bg-white rounded-full shadow-lg p-1 whitespace-nowrap" @click.stop>
                <!-- Reformulate button with hover menu -->
                <div class="relative group/reformulate">
                  <button 
                    class="px-3 py-1 text-sm font-medium text-[#090C9B] hover:bg-[#B4C5E4]/20 rounded-full transition-colors flex items-center cursor-default"
                  >
                    <PencilIcon class="h-4 w-4 mr-1" />
                    {{ translations[language].reformulate }}
                  </button>
                  
                  <!-- Transparent bridge to prevent hover gap issues -->
                  <div class="absolute w-full h-3 bottom-full left-0 bg-transparent"></div>
                  
                  <!-- Style options that appear on hover -->
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-full shadow-lg p-1 hidden group-hover/reformulate:flex space-x-1 z-30 whitespace-nowrap">
                    <button 
                      v-for="tone in toneOptions" 
                      :key="tone.name"
                      @click.stop="modifySentence(index, tone.name)"
                      class="px-3 py-1 text-sm font-medium text-[#090C9B] hover:bg-[#B4C5E4]/20 rounded-full transition-colors flex items-center cursor-pointer"
                    >
                      <span class="mr-1">{{ tone.icon }}</span>
                      {{ tone.name }}
                    </button>
                  </div>
                </div>
                
                <!-- Auto Complete button -->
                <button 
                  @click.stop="autoCompleteParagraph(index)"
                  class="px-3 py-1 text-sm font-medium text-[#090C9B] hover:bg-[#B4C5E4]/20 rounded-full transition-colors flex items-center"
                >
                  <ChatBubbleBottomCenterTextIcon class="h-4 w-4 mr-1" />
                  {{ translations[language].autoComplete }}
                </button>
                
                <!-- Concise button -->
                <button 
                  @click.stop="makeConcise(index)"
                  class="px-3 py-1 text-sm font-medium text-[#090C9B] hover:bg-[#B4C5E4]/20 rounded-full transition-colors flex items-center"
                >
                  <ScissorsIcon class="h-4 w-4 mr-1" />
                  {{ translations[language].concise }}
                </button>
              </div>
              
              <!-- Next variation button -->
              <button 
                v-if="letterStore.hasVariations(index)"
                @click.stop="letterStore.nextVariation(index)"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-[#B4C5E4]/20 transition-colors text-[#090C9B]"
                title="Next variation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <!-- Placeholder input dialog -->
            <div 
              v-if="editingPlaceholder && editingPlaceholderIndex === index" 
              class="absolute left-1/2 transform -translate-x-1/2 -translate-y-12 bg-white rounded-full shadow-lg p-1 z-20 flex items-center"
              @click.stop
              style="min-width: 250px;"
            >
              <input 
                ref="placeholderInput"
                v-model="placeholderValue" 
                class="w-full px-3 py-1 text-sm rounded-l-full border-0 focus:ring-2 focus:ring-[#3D52D5] focus:ring-opacity-50 focus:ring-offset-0 focus:outline-none"
                :placeholder="currentPlaceholder.replace(/[\[\]]/g, '')"
                @keyup.enter="confirmPlaceholderEdit"
              />
              <button 
                @click="confirmPlaceholderEdit"
                class="p-1 w-8 h-8 flex items-center justify-center bg-white rounded-full transition-colors text-[#090C9B] hover:bg-[#B4C5E4]/20"
                title="Confirm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Placeholder input -->
    <div v-if="showingPlaceholderInput" class="placeholder-input-container" :style="placeholderInputPosition">
      <div class="placeholder-input-header">
        <span>{{ placeholderInputLabel }}</span>
        <button @click="cancelPlaceholderInput" class="close-button">×</button>
      </div>
      <input 
        ref="placeholderInput"
        v-model="placeholderInputValue" 
        class="placeholder-input focus:ring-2 focus:ring-[#3D52D5] focus:ring-opacity-50 focus:ring-offset-0 focus:border-[#3D52D5]" 
        :placeholder="translations[letterStore.language].enterValue"
        @keyup.enter="savePlaceholderValue"
      />
      <div class="placeholder-input-actions">
        <button @click="savePlaceholderValue" class="save-button">
          {{ translations[letterStore.language].save }}
        </button>
        <button @click="cancelPlaceholderInput" class="cancel-button">
          {{ translations[letterStore.language].cancel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useLetterStore } from '../stores/letter'
import { useToast } from 'vue-toastification'
import Cookies from 'js-cookie'
import { 
  PencilIcon, 
  ChatBubbleBottomCenterTextIcon, 
  ScissorsIcon 
} from '@heroicons/vue/24/outline'

const props = defineProps({
  language: {
    type: String,
    default: 'en'
  },
  idCardRef: {
    type: Object,
    required: false,
    default: null
  }
})

const toast = useToast()
const letterStore = useLetterStore()
const selectedParagraphIndex = ref(null)
const loadingParagraphIndex = ref(null)
const letterContainer = ref(null)

// Add notification ref
const notification = ref({ show: false, type: 'success', message: '' })

// Add icon animation states
const copyIconAnimating = ref(false)
const pdfIconAnimating = ref(false)
const copySuccess = ref(false)
const pdfSuccess = ref(false)

// Placeholder editing state
const editingPlaceholder = ref(false)
const editingPlaceholderIndex = ref(null)
const currentPlaceholder = ref('')
const placeholderValue = ref('')
const placeholderInput = ref(null)

// Placeholder input
const showingPlaceholderInput = ref(false)
const placeholderInputPosition = ref({ top: '0px', left: '0px', width: '200px' })
const placeholderInputLabel = ref('')
const placeholderInputValue = ref('')
const currentPlaceholderTarget = ref(null)

const translations = {
  en: {
    emptyState: 'Your letter will appear here',
    preview: 'Preview',
    reformulate: 'Reformulate',
    autoComplete: 'Auto-complete',
    autoCompleting: 'Auto-completing...',
    autoCompleteFailed: 'Failed to auto-complete',
    concise: 'Concise',
    cancel: 'Cancel',
    success: 'Success!',
    error: 'Error',
    idCard: 'ID Card',
    enterValue: 'Enter value',
    confirm: 'Confirm',
    placeholderReplaced: 'Placeholder replaced',
    paragraphAutoCompleted: 'Paragraph auto-completed',
    save: 'Save',
    placeholderSaved: 'Placeholder saved',
    placeholderCancelled: 'Cancelled',
    copyToClipboard: 'Copy to clipboard',
    copied: 'Copied to clipboard',
    copyFailed: 'Failed to copy',
    downloadPDF: 'Download PDF',
    downloadingPDF: 'Downloading PDF...',
    downloadFailed: 'Failed to download',
    downloadSuccess: 'PDF downloaded',
    regenerate: 'Regenerate',
    regenerating: 'Regenerating...',
    regenerateFailed: 'Failed to regenerate',
    regenerateSuccess: 'Letter regenerated',
    edit: 'Edit',
    editFailed: 'Failed to save edits',
    editSuccess: 'Edits saved',
    editCancelled: 'Edits cancelled',
  },
  fr: {
    emptyState: 'Votre lettre apparaîtra ici',
    preview: 'Aperçu',
    reformulate: 'Reformuler',
    autoComplete: 'Auto-compléter',
    autoCompleting: 'Auto-complétion...',
    autoCompleteFailed: 'Échec de l\'auto-complétion',
    concise: 'Concis',
    cancel: 'Annuler',
    success: 'Succès!',
    error: 'Erreur',
    idCard: 'Carte d\'identité',
    enterValue: 'Entrer une valeur',
    confirm: 'Confirmer',
    placeholderReplaced: 'Placeholder remplacé',
    paragraphAutoCompleted: 'Paragraphe auto-complété',
    save: 'Enregistrer',
    placeholderSaved: 'Placeholder enregistré',
    placeholderCancelled: 'Annulé',
    copyToClipboard: 'Copier dans le presse-papier',
    copied: 'Copié dans le presse-papier',
    copyFailed: 'Échec de la copie',
    downloadPDF: 'Télécharger PDF',
    downloadingPDF: 'Téléchargement du PDF...',
    downloadFailed: 'Échec du téléchargement',
    downloadSuccess: 'PDF téléchargé',
    regenerate: 'Régénérer',
    regenerateFailed: 'Échec de la régénération',
    regenerateSuccess: 'Lettre régénérée',
    edit: 'Modifier',
    editFailed: 'Échec de l\'enregistrement des modifications',
    editSuccess: 'Modifications enregistrées',
    editCancelled: 'Modifications annulées',
  }
}

const toneOptions = [
  { name: 'Professional', icon: '👔' },
  { name: 'Friendly', icon: '😊' },
  { name: 'Confident', icon: '💪' },
  { name: 'Persuasive', icon: '🎯' },
]

const letter = computed(() => letterStore.letter)
const letterParagraphs = computed(() => letterStore.paragraphs)

// Show notification
function showNotification(type, message) {
  notification.value = { show: true, type, message }
  
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else if (type === 'info') {
    toast.info(message);
  } else if (type === 'warning') {
    toast.warning(message);
  }
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.value = { show: false, type: '', message: '' }
  }, 3000)
}

// Handle clicks outside the menu to close it
const handleClickOutside = (event) => {
  // If we're not clicking on a paragraph or the menu, close the menu
  if (selectedParagraphIndex.value !== null) {
    selectedParagraphIndex.value = null
  }
  
  // Also close placeholder editing if clicking outside
  if (editingPlaceholder.value) {
    editingPlaceholder.value = false
  }
}

// Add global click event listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const modifySentence = async (index, tone) => {
  console.log(`Modifying sentence at index ${index} with tone ${tone}, language: ${props.language}`)
  loadingParagraphIndex.value = index
  selectedParagraphIndex.value = null
  
  try {
    console.log('Paragraph content:', letterParagraphs.value[index])
    const personalInfo = props.idCardRef?.personalInfo || null
    const result = await letterStore.modifySentence(index, tone, props.language || 'en', personalInfo)
    console.log('Modification result:', result)
    showNotification('success', `${translations[props.language].reformulate}: ${tone}`)
  } catch (error) {
    console.error('Error modifying sentence:', error)
    showNotification('error', error.message || 'Failed to reformulate')
  } finally {
    loadingParagraphIndex.value = null
  }
}

const autoCompleteParagraph = async (index) => {
  try {
    console.log('Auto-completing paragraph at index:', index);
    
    // Get the paragraph content directly from the paragraphs array
    const paragraph = letterParagraphs.value[index];
    if (!paragraph) {
      console.error('Paragraph not found at index:', index);
      return;
    }

    // Check if the paragraph contains any placeholders
    const paragraphText = paragraph;
    const placeholderRegex = /\[(.*?)\]/g;
    const placeholders = [...paragraphText.matchAll(placeholderRegex)];
    
    console.log('Paragraph text:', paragraphText);
    console.log('Found placeholders:', placeholders);

    if (placeholders.length > 0) {
      // Get personal information from cookies
      const personalInfoCookie = Cookies.get('personalInfo');
      let personalInfo = null;
      
      if (personalInfoCookie) {
        try {
          personalInfo = JSON.parse(personalInfoCookie);
          console.log('Found personal info in cookies:', personalInfo);
        } catch (e) {
          console.error('Error parsing personal info from cookies:', e);
        }
      }

      // Process each placeholder in sequence
      let currentText = paragraphText;
      for (const match of placeholders) {
        const placeholder = match[0]; // Full placeholder with brackets
        const placeholderText = match[1]; // Text inside brackets
        
        console.log('Processing placeholder:', placeholder, 'with text:', placeholderText);
        
        // Check if we can use personal info
        let directMatch = null;
        const personalInfoKeywords = {
          fullName: ['name', 'nom', 'prénom', 'prenom', 'full name', 'nom complet', 'nom et prénom', 'nom et prenom', 'prénom et nom', 'prenom et nom', 'nom', 'prénom', 'prenom'],
          email: ['email', 'e-mail', 'courriel', 'mail', 'electronic mail', 'courrier électronique'],
          phone: ['phone', 'telephone', 'téléphone', 'mobile', 'cell', 'cellphone', 'portable'],
          address: ['address', 'adresse', 'location', 'lieu', 'domicile', 'residence', 'résidence'],
          education: ['education', 'éducation', 'degree', 'diplôme', 'diplome', 'university', 'université', 'universite', 'school', 'école', 'ecole', 'college', 'collège', 'college', 'formation', 'training', 'études', 'etudes'],
          experience: ['experience', 'expérience', 'work', 'travail', 'job', 'emploi', 'career', 'carrière', 'carriere', 'profession', 'occupation'],
          skills: ['skill', 'skills', 'compétence', 'competence', 'compétences', 'competences', 'ability', 'abilities', 'capacité', 'capacite', 'aptitude']
        };

        // Handle date placeholders
        if (placeholderText.toLowerCase().includes('date') || 
            placeholderText.toLowerCase().includes('jour') || 
            placeholderText.toLowerCase().includes('mois') || 
            placeholderText.toLowerCase().includes('année') || 
            placeholderText.toLowerCase().includes('annee')) {
          const today = new Date();
          directMatch = letterStore.language === 'fr' 
            ? today.toLocaleDateString('fr-FR')
            : today.toLocaleDateString('en-US');
        }
        // Check personal info
        else if (personalInfo) {
          for (const [infoType, keywords] of Object.entries(personalInfoKeywords)) {
            if (keywords.some(keyword => placeholderText.toLowerCase().includes(keyword))) {
              const infoValue = personalInfo[infoType];
              if (infoValue && infoValue.trim() !== '') {
                directMatch = infoValue;
                break;
              }
            }
          }
        }

        if (directMatch) {
          // Use direct match from personal info or system date
          currentText = currentText.replace(placeholder, directMatch);
          console.log('Using direct match:', directMatch);
        } else {
          // If no direct match, show the editing UI for user input
          editingPlaceholder.value = true;
          editingPlaceholderIndex.value = index;
          currentPlaceholder.value = placeholder;
          placeholderValue.value = '';
          
          // Focus the input after it's rendered
          await nextTick();
          const inputElement = document.querySelector('input[ref="placeholderInput"]');
          if (inputElement && typeof inputElement.focus === 'function') {
            inputElement.focus();
          }
          return; // Stop processing other placeholders
        }
      }

      // Update the paragraph with all replacements
      letterStore.updateParagraph(index, currentText);
      showNotification('success', translations[props.language].placeholderReplaced);
    } else {
      console.log('No placeholders found, attempting to auto-complete paragraph');
      // If no placeholders, auto-complete the paragraph
      await letterStore.autoCompleteParagraph(paragraphText);
      showNotification('success', translations[props.language].paragraphAutoCompleted);
    }
  } catch (error) {
    console.error('Error in autoCompleteParagraph:', error);
    showNotification('error', 'Failed to auto-complete: ' + error.message);
  }
}

const makeConcise = async (index) => {
  console.log(`Making paragraph concise at index ${index}, language: ${props.language}`)
  loadingParagraphIndex.value = index
  selectedParagraphIndex.value = null
  
  try {
    console.log('Paragraph content:', letterParagraphs.value[index])
    const personalInfo = props.idCardRef?.personalInfo || null
    const result = await letterStore.makeConcise(index, props.language || 'en', personalInfo)
    console.log('Concise result:', result)
    showNotification('success', translations[props.language].concise)
  } catch (error) {
    console.error('Error making paragraph concise:', error)
    showNotification('error', error.message || 'Failed to make concise')
  } finally {
    loadingParagraphIndex.value = null
  }
}

const copyToClipboard = async () => {
  if (!letter.value) {
    showNotification('error', translations[props.language].copyFailed)
    return
  }
  
  copyIconAnimating.value = true
  
  try {
    const result = await letterStore.copyToClipboard()
    
    if (result.success) {
      copySuccess.value = true
      showNotification('success', translations[props.language].copied)
      
      // Reset icon after animation
      setTimeout(() => {
        copySuccess.value = false
        copyIconAnimating.value = false
      }, 2000)
    } else {
      throw new Error(result.error || 'Unknown error')
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    showNotification('error', translations[props.language].copyFailed)
    copyIconAnimating.value = false
  }
}

const downloadPDF = async () => {
  if (!letter.value || !letterContainer.value) {
    showNotification('error', translations[props.language].downloadFailed)
    return
  }
  
  pdfIconAnimating.value = true
  showNotification('info', translations[props.language].downloadingPDF)
  
  try {
    // Get the letter container element
    const contentElement = letterContainer.value.querySelector('.bg-\\[\\#FFFFFC\\]')
    
    if (!contentElement) {
      throw new Error('Could not find letter content element')
    }
    
    const result = await letterStore.downloadPDF(contentElement)
    
    if (result && result.success) {
      pdfSuccess.value = true
      showNotification('success', translations[props.language].downloadSuccess)
      
      // Reset icon after animation
      setTimeout(() => {
        pdfSuccess.value = false
        pdfIconAnimating.value = false
      }, 2000)
    } else {
      throw new Error(result?.error || 'Unknown error')
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
    showNotification('error', translations[props.language].downloadFailed)
    pdfIconAnimating.value = false
  }
}

const hasPlaceholder = (text) => {
  return text.includes('[') && text.includes(']')
}

const isPlaceholder = (text) => {
  return text.startsWith('[') && text.endsWith(']')
}

const extractPlaceholders = (text) => {
  const placeholders = []
  let startIndex = text.indexOf('[')
  
  while (startIndex !== -1) {
    const endIndex = text.indexOf(']', startIndex)
    if (endIndex === -1) break
    
    placeholders.push(text.slice(startIndex, endIndex + 1))
    startIndex = text.indexOf('[', endIndex + 1)
  }
  
  return placeholders
}

const isPersonalInfo = (placeholder) => {
  const personalInfoKeywords = [
    'name', 'address', 'phone', 'email', 'birth', 'age', 
    'education', 'degree', 'university', 'school', 'college',
    'experience', 'job', 'position', 'company', 'employer',
    'skill', 'qualification', 'certification', 'license'
  ]
  
  const lowerPlaceholder = placeholder.toLowerCase()
  return personalInfoKeywords.some(keyword => lowerPlaceholder.includes(keyword))
}

const splitParagraphParts = (paragraph) => {
  const parts = []
  let currentIndex = 0
  let startIndex = paragraph.indexOf('[')

  while (startIndex !== -1) {
    // Add text before placeholder
    if (startIndex > currentIndex) {
      parts.push(paragraph.slice(currentIndex, startIndex))
    }

    // Find end of placeholder
    const endIndex = paragraph.indexOf(']', startIndex)
    if (endIndex === -1) break

    // Add placeholder
    parts.push(paragraph.slice(startIndex, endIndex + 1))
    
    currentIndex = endIndex + 1
    startIndex = paragraph.indexOf('[', currentIndex)
  }

  // Add remaining text
  if (currentIndex < paragraph.length) {
    parts.push(paragraph.slice(currentIndex))
  }

  return parts
}

// Show placeholder input
async function showPlaceholderInput(target) {
  try {
    console.log('Showing placeholder input for:', target.textContent);
    
    // Get the paragraph containing the placeholder
    const paragraph = target.closest('p');
    if (!paragraph) {
      console.error('Could not find paragraph containing placeholder');
      return;
    }
    
    // Get the placeholder text
    const placeholder = target.textContent;
    const placeholderText = placeholder.replace(/[\[\]]/g, '');
    
    // Position the input near the placeholder
    const rect = target.getBoundingClientRect();
    const containerRect = letterContainer.value.getBoundingClientRect();
    
    placeholderInputPosition.value = {
      top: `${rect.top - containerRect.top + window.scrollY}px`,
      left: `${rect.left - containerRect.left + window.scrollX}px`,
      width: `${Math.max(rect.width, 200)}px`
    };
    
    // Set the placeholder text
    placeholderInputLabel.value = placeholderText;
    placeholderInputValue.value = '';
    
    // Show the input
    showingPlaceholderInput.value = true;
    
    // Focus the input after it's rendered
    await nextTick();
    try {
      if (placeholderInput.value && typeof placeholderInput.value.focus === 'function') {
        placeholderInput.value.focus();
      }
    } catch (e) {
      console.error('Error focusing placeholder input:', e);
    }
    
    // Store the target for later use
    currentPlaceholderTarget.value = target;
  } catch (error) {
    console.error('Error in showPlaceholderInput:', error);
    toast.error(translations[letterStore.language].autoCompleteFailed + ': ' + error.message);
  }
}

// Confirm the placeholder edit
const confirmPlaceholderEdit = async () => {
  if (placeholderValue.value.trim()) {
    await letterStore.replacePlaceholder(
      editingPlaceholderIndex.value, 
      currentPlaceholder.value, 
      placeholderValue.value
    )
    showNotification('success', 'Placeholder updated')
  }
  
  // Reset the editing state
  editingPlaceholder.value = false
  editingPlaceholderIndex.value = null
  currentPlaceholder.value = ''
  placeholderValue.value = ''
}

const handlePlaceholderClick = async (paragraphIndex, placeholder) => {
  try {
    console.log('Placeholder clicked:', placeholder);
    
    // Get personal information from cookies
    const personalInfoCookie = Cookies.get('personalInfo');
    let personalInfo = null;
    
    if (personalInfoCookie) {
      try {
        personalInfo = JSON.parse(personalInfoCookie);
        console.log('Found personal info in cookies:', personalInfo);
      } catch (e) {
        console.error('Error parsing personal info from cookies:', e);
      }
    }
    
    // Define keywords for personal information in both English and French
    const personalInfoKeywords = {
      fullName: ['full name', 'nom complet', 'nom et prénom', 'nom et prenom', 'prénom et nom', 'prenom et nom'],
      email: ['email', 'e-mail', 'courriel', 'mail', 'electronic mail', 'courrier électronique'],
      phone: ['phone', 'telephone', 'téléphone', 'mobile', 'cell', 'cellphone', 'portable'],
      address: ['address', 'adresse', 'location', 'lieu', 'domicile', 'residence', 'résidence'],
      education: ['education', 'éducation', 'degree', 'diplôme', 'diplome', 'university', 'université', 'universite', 'school', 'école', 'ecole', 'college', 'collège', 'college', 'formation', 'training', 'études', 'etudes'],
      experience: ['experience', 'expérience', 'work', 'travail', 'job', 'emploi', 'career', 'carrière', 'carriere', 'profession', 'occupation'],
      skills: ['skill', 'skills', 'compétence', 'competence', 'compétences', 'competences', 'ability', 'abilities', 'capacité', 'capacite', 'aptitude']
    };
    
    // Check if the placeholder is for personal information
    const placeholderText = placeholder.replace(/[\[\]]/g, '').toLowerCase();
    let directMatch = null;
    
    // Handle date placeholders with system date
    if (placeholderText.includes('date') || placeholderText.includes('jour') || placeholderText.includes('mois') || placeholderText.includes('année') || placeholderText.includes('annee')) {
      // Format the current date based on the language
      const today = new Date();
      if (letterStore.language === 'fr') {
        // French date format: DD/MM/YYYY
        directMatch = today.toLocaleDateString('fr-FR');
      } else {
        // English date format: MM/DD/YYYY
        directMatch = today.toLocaleDateString('en-US');
      }
      console.log('Using system date for date placeholder:', directMatch);
    }
    // Check if we have personal info that matches the placeholder
    else if (personalInfo) {
      // Check each category of personal information
      for (const [infoType, keywords] of Object.entries(personalInfoKeywords)) {
        // If any keyword matches the placeholder text exactly
        if (keywords.some(keyword => placeholderText === keyword)) {
          // Check if we have this information in the personal info
          const infoValue = personalInfo[infoType];
          if (infoValue && infoValue.trim() !== '') {
            console.log(`Using personal ${infoType} information:`, infoValue);
            directMatch = infoValue;
            break;
          }
        }
      }
    }
    
    // If we found a direct match for basic personal info, use it
    if (directMatch && (
      placeholderText === 'full name' || 
      placeholderText === 'nom complet' || 
      placeholderText === 'email' || 
      placeholderText === 'mail' || 
      placeholderText === 'phone' || 
      placeholderText === 'téléphone' || 
      placeholderText === 'address' || 
      placeholderText === 'adresse'
    )) {
      console.log('Using direct match for basic personal info:', directMatch);
      
      // Replace the placeholder with the direct match in the current paragraph
      const currentParagraph = letterParagraphs.value[paragraphIndex];
      const newContent = currentParagraph.replace(placeholder, directMatch);
      
      // Update the letter content
      letterStore.updateParagraph(paragraphIndex, newContent);
      
      // Show success notification
      showNotification('success', translations[props.language].placeholderReplaced);
    } else {
      // For all other cases, use AI completion
      try {
        // Show loading state
        loadingParagraphIndex.value = paragraphIndex;
        
        // Get the current paragraph for context
        const currentParagraph = letterParagraphs.value[paragraphIndex];
        
        // Get the full letter content for better context
        const fullLetterContent = letterParagraphs.value.join('\n\n');
        
        // Get the company name from the letter content
        const companyMatch = fullLetterContent.match(/chez\s+([^.,\n]+)/i);
        const companyName = companyMatch ? companyMatch[1].trim() : '';
        
        // Get the position type from the letter content
        const positionMatch = fullLetterContent.match(/candidature\s+pour\s+un\s+([^.,\n]+)/i);
        const positionType = positionMatch ? positionMatch[1].trim() : '';
        
        // Call the AI completion endpoint with enhanced context
        const response = await fetch('/api/auto-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: currentParagraph,
            placeholder: placeholderText,
            language: letterStore.language,
            model: letterStore.model,
            fullContext: fullLetterContent,
            personalInfo: personalInfo,
            companyName: companyName,
            positionType: positionType,
            prompt: `Complete the placeholder [${placeholderText}] in this cover letter paragraph. 
                    This is a cover letter for ${positionType} at ${companyName}.
                    The completion should be contextually appropriate and maintain the professional tone of the letter.
                    
                    Guidelines for completion:
                    1. For education/formation placeholders: Include specific details about your academic background, degrees, and relevant coursework.
                    2. For experience/expérience placeholders: Provide concrete examples of relevant work experience, projects, or achievements.
                    3. For skills/compétences placeholders: List specific technical and soft skills relevant to the position.
                    4. For projects/projets placeholders: Describe specific projects you've worked on, their outcomes, and your role.
                    5. For achievements/réalisations placeholders: Highlight specific accomplishments with measurable results.
                    
                    The completion should:
                    - Flow naturally with the surrounding text
                    - Maintain the letter's formal style
                    - Be specific and relevant to the position
                    - Use appropriate professional language
                    - Match the overall tone of the letter
                    
                    If the placeholder is about education, experience, or skills, provide relevant and specific details.
                    If the placeholder is about a project or achievement, provide a concrete example that fits the context.`
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI completion');
        }

        const data = await response.json();
        
        if (data.completion) {
          // Replace the placeholder with the AI completion
          const newContent = currentParagraph.replace(placeholder, data.completion);
          
          // Update the letter content
          letterStore.updateParagraph(paragraphIndex, newContent);
          
          // Show success notification
          showNotification('success', translations[props.language].placeholderReplaced);
        } else {
          // If AI completion fails, show the editing UI
          editingPlaceholder.value = true;
          editingPlaceholderIndex.value = paragraphIndex;
          currentPlaceholder.value = placeholder;
          placeholderValue.value = '';
          
          // Focus the input after it's rendered
          await nextTick();
          const inputElement = document.querySelector('input[ref="placeholderInput"]');
          if (inputElement && typeof inputElement.focus === 'function') {
            inputElement.focus();
          }
        }
      } catch (error) {
        console.error('Error getting AI completion:', error);
        // If AI completion fails, show the editing UI
        editingPlaceholder.value = true;
        editingPlaceholderIndex.value = paragraphIndex;
        currentPlaceholder.value = placeholder;
        placeholderValue.value = '';
        
        // Focus the input after it's rendered
        await nextTick();
        const inputElement = document.querySelector('input[ref="placeholderInput"]');
        if (inputElement && typeof inputElement.focus === 'function') {
          inputElement.focus();
        }
      } finally {
        // Clear loading state
        loadingParagraphIndex.value = null;
      }
    }
  } catch (error) {
    console.error('Error in handlePlaceholderClick:', error);
    showNotification('error', translations[props.language].autoCompleteFailed + ': ' + error.message);
    // Clear loading state in case of error
    loadingParagraphIndex.value = null;
  }
}

const handleParagraphClick = (index, paragraph) => {
  // Toggle selection of paragraph
  if (selectedParagraphIndex.value === index) {
    selectedParagraphIndex.value = null
  } else {
    selectedParagraphIndex.value = index
  }
}

// Save placeholder value
function savePlaceholderValue() {
  try {
    console.log('Saving placeholder value:', placeholderInputValue.value);
    
    if (!currentPlaceholderTarget.value) {
      console.error('No current placeholder target');
      return;
    }
    
    // Get the paragraph containing the placeholder
    const paragraph = currentPlaceholderTarget.value.closest('p');
    if (!paragraph) {
      console.error('Could not find paragraph containing placeholder');
      return;
    }
    
    // Get the placeholder text
    const placeholder = currentPlaceholderTarget.value.textContent;
    
    // Replace the placeholder with the input value
    const paragraphText = paragraph.textContent;
    const newContent = paragraphText.replace(placeholder, placeholderInputValue.value);
    
    // Update the letter content
    letterStore.setLetterContent(letterStore.letterContent.replace(paragraphText, newContent));
    
    // Hide the input
    showingPlaceholderInput.value = false;
    currentPlaceholderTarget.value = null;
    
    // Show success notification
    toast.success(translations[letterStore.language].placeholderSaved);
  } catch (error) {
    console.error('Error in savePlaceholderValue:', error);
    toast.error(translations[letterStore.language].autoCompleteFailed + ': ' + error.message);
  }
}

// Cancel placeholder input
function cancelPlaceholderInput() {
  showingPlaceholderInput.value = false;
  currentPlaceholderTarget.value = null;
  toast.info(translations[letterStore.language].placeholderCancelled);
}
</script>

<style scoped>
.letter-preview {
  position: relative;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  font-family: 'Times New Roman', Times, serif;
  font-size: 1rem;
  line-height: 1.5;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 400px;
  color: #888;
  font-style: italic;
}

.letter-content {
  white-space: pre-wrap;
}

.letter-content :deep(p) {
  margin-bottom: 1rem;
}

.letter-content :deep(.placeholder) {
  background-color: #f0f8ff;
  padding: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px dashed #4a90e2;
  display: inline-block;
}

.letter-content :deep(.placeholder:hover) {
  background-color: #e6f2ff;
  border-color: #2a70c2;
}

.placeholder-input-container {
  position: absolute;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  z-index: 100;
  min-width: 200px;
}

.placeholder-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #888;
}

.close-button:hover {
  color: #333;
}

.placeholder-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.placeholder-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.save-button, .cancel-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  background-color: #4a90e2;
  color: white;
}

.save-button:hover {
  background-color: #2a70c2;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

/* Add padding to prevent focus ring from being cut off */
input:focus, button:focus {
  outline: none;
}

/* Ensure focus rings are visible */
.dropdown-container button:focus,
input:focus {
  box-shadow: 0 0 0 2px rgba(61, 82, 213, 0.5);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>