<template>
  <div 
    class="fixed top-16 h-[calc(100vh-4rem)] bg-[#FFFFFC] transition-all duration-300 z-20 overflow-auto"
    :class="isOpen ? 'w-80 left-[25%]' : 'w-0 left-[25%]'"
  >
    <div class="p-6 w-full h-full flex flex-col">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium leading-6 text-[#3C3744]">
          {{ translations[language].idCard }}
        </h3>
        <button 
          @click="toggleSidebar" 
          class="text-[#3C3744] hover:text-[#090C9B]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Auto-save indicator -->
      <div 
        v-if="showAutoSaveIndicator" 
        class="fixed top-4 right-4 z-50 p-2 rounded-lg bg-blue-100 text-blue-800 text-sm transition-opacity duration-300"
        :class="{ 'opacity-0': autoSaveIndicatorFading }"
      >
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{{ translations[language].autoSaved }}</span>
        </div>
      </div>

      <div class="space-y-4 flex-1 overflow-auto">
        <!-- Personal Information Form -->
        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].fullName }}
          </label>
          <input
            type="text"
            v-model="personalInfo.fullName"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].fullNamePlaceholder"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].email }}
          </label>
          <input
            type="email"
            v-model="personalInfo.email"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].emailPlaceholder"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].phone }}
          </label>
          <input
            type="tel"
            v-model="personalInfo.phone"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].phonePlaceholder"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].address }}
          </label>
          <textarea
            v-model="personalInfo.address"
            rows="3"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].addressPlaceholder"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].education }}
          </label>
          <textarea
            v-model="personalInfo.education"
            rows="3"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].educationPlaceholder"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].experience }}
          </label>
          <textarea
            v-model="personalInfo.experience"
            rows="3"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].experiencePlaceholder"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-[#3C3744] mb-2">
            {{ translations[language].skills }}
          </label>
          <textarea
            v-model="personalInfo.skills"
            rows="3"
            class="mt-1 block w-full rounded-md border-[#B4C5E4] focus:border-[#3D52D5] focus:ring focus:ring-[#3D52D5] focus:ring-opacity-50 px-4 py-2 bg-[#FFFFFC]"
            :placeholder="translations[language].skillsPlaceholder"
          ></textarea>
        </div>
      </div>

      <!-- Save confirmation message -->
      <div v-if="showSaveConfirmation" class="mt-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center justify-between">
        <span>{{ translations[language].saveConfirmation }}</span>
        <button @click="showSaveConfirmation = false" class="text-green-600 hover:text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Reset confirmation dialog -->
      <div v-if="showResetConfirmation" class="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
        <p class="mb-2">{{ translations[language].resetConfirmation }}</p>
        <div class="flex justify-end space-x-2">
          <button 
            @click="cancelReset" 
            class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            {{ translations[language].cancel }}
          </button>
          <button 
            @click="confirmReset" 
            class="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
          >
            {{ translations[language].confirm }}
          </button>
        </div>
      </div>

      <div class="mt-6 flex space-x-2">
        <button
          @click="savePersonalInfo"
          class="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#090C9B] hover:bg-[#3D52D5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3D52D5]"
        >
          {{ translations[language].save }}
        </button>
        
        <button
          @click="resetPersonalInfo"
          class="inline-flex items-center justify-center px-3 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          title="Reset all information"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useCookies } from 'vue3-cookies'

const props = defineProps({
  language: {
    type: String,
    required: true
  }
})

const { cookies } = useCookies()
const isOpen = ref(false)
const showSaveConfirmation = ref(false)
const showAutoSaveIndicator = ref(false)
const autoSaveIndicatorFading = ref(false)
const autoSaveTimeout = ref(null)
const showResetConfirmation = ref(false)
const personalInfo = reactive({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  education: '',
  experience: '',
  skills: ''
})

// Storage keys
const STORAGE_KEYS = {
  COOKIE: 'personalInfo',
  LOCAL_STORAGE: 'personalInfo'
}

// Save to both cookie and localStorage
const saveToStorage = (data) => {
  try {
    // Convert data to JSON string only once
    const jsonData = JSON.stringify(data)
    
    // Save to cookie with 1 year expiration
    cookies.set(STORAGE_KEYS.COOKIE, jsonData, '1y')
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE, jsonData)
    
    console.log('Personal information saved to both cookie and localStorage')
  } catch (error) {
    console.error('Error saving personal information:', error)
  }
}

// Load from both cookie and localStorage
const loadFromStorage = () => {
  try {
    // Try to load from cookie first
    const cookieData = cookies.get(STORAGE_KEYS.COOKIE)
    if (cookieData) {
      try {
        const parsedData = JSON.parse(cookieData)
        // Update each field individually to maintain reactivity
        Object.keys(personalInfo).forEach(key => {
          if (parsedData[key] !== undefined) {
            personalInfo[key] = parsedData[key]
          }
        })
        console.log('Loaded personal info from cookie:', parsedData)
        return
      } catch (e) {
        console.error('Error parsing cookie data:', e)
      }
    }
    
    // If no cookie data or parsing failed, try localStorage
    const localStorageData = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE)
    if (localStorageData) {
      try {
        const parsedData = JSON.parse(localStorageData)
        // Update each field individually to maintain reactivity
        Object.keys(personalInfo).forEach(key => {
          if (parsedData[key] !== undefined) {
            personalInfo[key] = parsedData[key]
          }
        })
        // Sync to cookie for consistency
        saveToStorage(parsedData)
        console.log('Loaded personal info from localStorage:', parsedData)
      } catch (e) {
        console.error('Error parsing localStorage data:', e)
      }
    }
  } catch (error) {
    console.error('Error loading personal information:', error)
  }
}

// Remove from both storage
const removeFromStorage = () => {
  try {
    cookies.remove(STORAGE_KEYS.COOKIE)
    localStorage.removeItem(STORAGE_KEYS.LOCAL_STORAGE)
    console.log('Personal information removed from both storage')
  } catch (error) {
    console.error('Error removing personal information:', error)
  }
}

const translations = {
  en: {
    idCard: 'Personal Information',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    email: 'Email',
    emailPlaceholder: 'Enter your email address',
    phone: 'Phone',
    phonePlaceholder: 'Enter your phone number',
    address: 'Address',
    addressPlaceholder: 'Enter your address',
    education: 'Education',
    educationPlaceholder: 'Enter your education details',
    experience: 'Experience',
    experiencePlaceholder: 'Enter your work experience',
    skills: 'Skills',
    skillsPlaceholder: 'Enter your skills',
    save: 'Save Information',
    saveConfirmation: 'Your information has been saved!',
    autoSaved: 'Auto-saved',
    resetConfirmation: 'Are you sure you want to clear all your personal information?',
    cancel: 'Cancel',
    confirm: 'Confirm',
    resetComplete: 'All information has been cleared'
  },
  fr: {
    idCard: 'Informations Personnelles',
    fullName: 'Nom Complet',
    fullNamePlaceholder: 'Entrez votre nom complet',
    email: 'Email',
    emailPlaceholder: 'Entrez votre adresse email',
    phone: 'Téléphone',
    phonePlaceholder: 'Entrez votre numéro de téléphone',
    address: 'Adresse',
    addressPlaceholder: 'Entrez votre adresse',
    education: 'Formation',
    educationPlaceholder: 'Entrez vos détails de formation',
    experience: 'Expérience',
    experiencePlaceholder: 'Entrez votre expérience professionnelle',
    skills: 'Compétences',
    skillsPlaceholder: 'Entrez vos compétences',
    save: 'Sauvegarder les Informations',
    saveConfirmation: 'Vos informations ont été sauvegardées!',
    autoSaved: 'Sauvegarde automatique',
    resetConfirmation: 'Êtes-vous sûr de vouloir effacer toutes vos informations personnelles?',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    resetComplete: 'Toutes les informations ont été effacées'
  }
}

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const savePersonalInfo = () => {
  saveToStorage(personalInfo)
  
  // Show confirmation message
  showSaveConfirmation.value = true
  
  // Hide confirmation after 3 seconds
  setTimeout(() => {
    showSaveConfirmation.value = false
  }, 3000)
}

// Reset personal information
const resetPersonalInfo = () => {
  showResetConfirmation.value = true
}

const cancelReset = () => {
  showResetConfirmation.value = false
}

const confirmReset = () => {
  // Clear all fields
  Object.keys(personalInfo).forEach(key => {
    personalInfo[key] = ''
  })
  
  // Remove from storage
  removeFromStorage()
  
  // Hide confirmation
  showResetConfirmation.value = false
  
  // Show success message
  showSaveConfirmation.value = true
  setTimeout(() => {
    showSaveConfirmation.value = false
  }, 3000)
}

// Show auto-save indicator
const showAutoSaveNotification = () => {
  // Reset the fading state
  autoSaveIndicatorFading.value = false
  
  // Show the indicator
  showAutoSaveIndicator.value = true
  
  // Start fading out after 1 second
  setTimeout(() => {
    autoSaveIndicatorFading.value = true
    
    // Hide completely after fade animation completes
    setTimeout(() => {
      showAutoSaveIndicator.value = false
    }, 300) // Match the duration of the transition
  }, 1000)
}

// Debounced auto-save function
const debouncedAutoSave = (newValue) => {
  // Clear any existing timeout
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  // Set a new timeout
  autoSaveTimeout.value = setTimeout(() => {
    saveToStorage(newValue)
    showAutoSaveNotification()
    autoSaveTimeout.value = null
  }, 1000) // Wait 1 second after typing stops before saving
}

// Auto-save personal info whenever it changes
watch(personalInfo, (newValue) => {
  debouncedAutoSave(newValue)
}, { deep: true })

// Load personal info on mount
onMounted(() => {
  console.log('IdCard component mounted, loading personal info')
  loadFromStorage()
})

// Export personal info for use in other components
defineExpose({
  personalInfo,
  toggleSidebar,
  saveToStorage,
  loadFromStorage,
  removeFromStorage
})
</script> 