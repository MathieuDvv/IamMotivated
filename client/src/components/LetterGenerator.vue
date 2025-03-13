<template>
  <div class="p-6 w-full h-full flex flex-col overflow-auto">
    <h3 class="text-lg font-medium leading-6 text-[#3C3744] mb-6">
      {{ translations[language].generateLetter }}
    </h3>
    <div class="space-y-6 flex-1 overflow-auto">
      <div>
        <label class="block text-sm font-medium text-[#3C3744] mb-2">
          {{ translations[language].destination }}
        </label>
        <input
          type="text"
          v-model="formData.destination"
          class="mt-1 block w-full rounded-md border-2 border-[#B4C5E4] focus:border-[#3D52D5] focus:ring-2 focus:ring-[#3D52D5] focus:ring-opacity-50 focus:ring-offset-0 px-4 py-2 bg-[#FFFFFC]"
          :placeholder="translations[language].destinationPlaceholder"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-[#3C3744] mb-2">
          {{ translations[language].goal }}
        </label>
        <!-- Custom dropdown for goal selection -->
        <div class="relative mt-1 dropdown-container">
          <button 
            @click="toggleGoalDropdown" 
            type="button" 
            class="relative w-full bg-[#FFFFFC] border-2 border-[#B4C5E4] rounded-md shadow-sm pl-4 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-[#3D52D5] focus:border-[#3D52D5] focus:ring-offset-0"
          >
            <div class="flex items-center">
              <component :is="goalIcons[formData.goal]" class="h-5 w-5 text-[#090C9B] mr-2" aria-hidden="true" />
              <span class="block truncate">{{ translations[language][formData.goal] }}</span>
            </div>
            <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </button>

          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div 
              v-if="showGoalDropdown" 
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
            >
              <div 
                v-for="option in goalOptions" 
                :key="option.value" 
                @click="selectGoal(option.value)"
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[#B4C5E4]/20"
                :class="{ 'bg-[#B4C5E4]/10': formData.goal === option.value }"
              >
                <div class="flex items-center">
                  <component :is="goalIcons[option.value]" class="h-5 w-5 text-[#090C9B] mr-2" aria-hidden="true" />
                  <span class="block truncate" :class="{ 'font-medium': formData.goal === option.value, 'font-normal': formData.goal !== option.value }">
                    {{ translations[language][option.value] }}
                  </span>
                </div>
                <span 
                  v-if="formData.goal === option.value" 
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-[#090C9B]"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-[#3C3744] mb-2">
          {{ translations[language].additionalInfo }}
        </label>
        <div class="mt-1 flex flex-col space-y-2">
          <input
            type="text"
            v-model="newTag"
            @keydown.enter.prevent="addTag"
            class="w-full rounded-md border-2 border-[#B4C5E4] focus:border-[#3D52D5] focus:ring-2 focus:ring-[#3D52D5] focus:ring-opacity-50 focus:ring-offset-0 px-4 py-2 bg-[#FFFFFC] text-[#3C3744] placeholder-gray-400"
            :placeholder="translations[language].additionalInfoPlaceholder"
          />
          <div class="flex flex-wrap gap-2 mt-2">
            <div 
              v-for="(tag, index) in formData.additionalInfoTags" 
              :key="index" 
              class="flex items-center bg-[#090C9B] text-white px-3 py-1 rounded-full text-sm"
            >
              <span>{{ tag }}</span>
              <button 
                @click="removeTag(index)" 
                class="ml-2 text-white hover:text-[#B4C5E4] focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-[#3C3744] mb-2">
          {{ translations[language].aiModel }}
        </label>
        <div class="mt-1 space-y-2">
          <!-- Custom dropdown for AI model selection -->
          <div class="relative dropdown-container">
            <button 
              @click="toggleModelDropdown" 
              type="button" 
              class="relative w-full bg-[#FFFFFC] border-2 border-[#B4C5E4] rounded-md shadow-sm pl-4 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-[#3D52D5] focus:border-[#3D52D5] focus:ring-offset-0"
              :disabled="!apiAvailability.claude && !apiAvailability.deepseek"
            >
              <div class="flex items-center">
                <span class="block truncate">{{ formData.model === 'claude' ? 'Claude' : 'Deepseek' }}</span>
                <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4C5E4] text-[#090C9B]">
                  {{ formData.model === 'claude' ? '3.5 Haiku' : 'Coder' }}
                </span>
              </div>
              <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </button>

            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div 
                v-if="showModelDropdown" 
                class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
              >
                <div 
                  v-for="option in modelOptions" 
                  :key="option.value" 
                  @click="selectModel(option.value)"
                  class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[#B4C5E4]/20"
                  :class="[
                    { 'bg-[#B4C5E4]/10': formData.model === option.value },
                    { 'opacity-50 cursor-not-allowed': !apiAvailability[option.value] }
                  ]"
                >
                  <div class="flex items-center">
                    <span class="block truncate" :class="{ 'font-medium': formData.model === option.value, 'font-normal': formData.model !== option.value }">
                      {{ option.label }}
                    </span>
                    <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4C5E4] text-[#090C9B]">
                      {{ option.version }}
                    </span>
                  </div>
                  <span 
                    v-if="formData.model === option.value" 
                    class="absolute inset-y-0 right-0 flex items-center pr-4 text-[#090C9B]"
                  >
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </transition>
          </div>
          <p v-if="!apiAvailability[formData.model]" class="text-sm text-amber-600">
            {{ translations[language].apiKeyRequired }}
          </p>
        </div>
      </div>

      <div class="flex justify-center mt-8 space-x-4">
        <button
          @click="generateLetter"
          class="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#090C9B] hover:bg-[#3D52D5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3D52D5] disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading || (formData.model === 'claude' && !apiAvailability.claude) || (formData.model === 'deepseek' && !apiAvailability.deepseek)"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ loading ? translations[language].generating : translations[language].generate }}</span>
        </button>
        
        <button
          @click="toggleIdCard"
          class="inline-flex items-center justify-center w-12 h-12 border border-[#B4C5E4] rounded-md shadow-sm text-[#090C9B] bg-white hover:bg-[#B4C5E4]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B4C5E4]"
          :title="translations[language].idCard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        </button>
      </div>

      <!-- Letter History Section -->
      <div v-if="letterStore.letterHistory.length > 0" class="mt-8">
        <h4 class="text-md font-medium text-[#3C3744] mb-4">{{ translations[language].letterHistory }}</h4>
        <div class="grid grid-cols-1 gap-4">
          <div 
            v-for="item in letterStore.letterHistory" 
            :key="item.id" 
            class="bg-[#FFFFFC] border border-[#B4C5E4] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            @click="letterStore.loadLetterFromHistory(item.id)"
          >
            <div class="flex justify-between items-start mb-2">
              <h5 class="font-medium text-[#090C9B] text-sm">{{ item.title }}</h5>
              <div class="flex space-x-2">
                <span class="text-xs text-[#736F72]">{{ item.date }}</span>
                <button 
                  @click.stop="letterStore.removeFromHistory(item.id)" 
                  class="text-[#736F72] hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p class="text-xs text-[#3C3744] line-clamp-3">{{ item.preview }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import axios from 'axios'
import { useLetterStore } from '../stores/letter'
import { useCookies } from 'vue3-cookies'
import { 
  AcademicCapIcon, 
  BriefcaseIcon, 
  BeakerIcon,
  CheckIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  language: {
    type: String,
    required: true
  },
  idCardRef: {
    type: Object,
    required: false,
    default: null
  }
})

const letterStore = useLetterStore()
const { cookies } = useCookies()

const translations = {
  en: {
    generateLetter: 'Generate Motivation Letter',
    destination: 'Destination (Company/School)',
    destinationPlaceholder: 'Enter company or school name',
    goal: 'Purpose',
    job: 'Job Application',
    internship: 'Internship',
    school: 'School Admission',
    additionalInfo: 'Additional Information (Keywords)',
    additionalInfoPlaceholder: 'Type a keyword and press Enter...',
    aiModel: 'AI Model',
    generating: 'Generating...',
    generate: 'Generate Letter',
    apiKeyRequired: 'API key required for this model',
    letterHistory: 'Letter History',
    idCard: 'ID Card',
  },
  fr: {
    generateLetter: 'Générer une Lettre de Motivation',
    destination: 'Destination (Entreprise/École)',
    destinationPlaceholder: 'Nom de l\'entreprise ou de l\'école',
    goal: 'Objectif',
    job: 'Candidature d\'emploi',
    internship: 'Stage',
    school: 'Admission à l\'école',
    additionalInfo: 'Informations Supplémentaires (Mots-clés)',
    additionalInfoPlaceholder: 'Mot-clé',
    aiModel: 'Modèle d\'IA',
    generating: 'Génération...',
    generate: 'Générer la Lettre',
    apiKeyRequired: 'Clé API requise pour ce modèle',
    letterHistory: 'Historique des Lettres',
    idCard: 'Carte d\'Identité',
  }
}

const formData = reactive({
  destination: '',
  goal: 'job',
  additionalInfoTags: [],
  model: 'claude'
})

// Dropdown state
const showGoalDropdown = ref(false)
const showModelDropdown = ref(false)
const goalDropdownRef = ref(null)
const modelDropdownRef = ref(null)

// Goal options with icons
const goalIcons = {
  job: BriefcaseIcon,
  internship: BeakerIcon,
  school: AcademicCapIcon
}

const goalOptions = [
  { value: 'job', label: 'Job Application' },
  { value: 'internship', label: 'Internship' },
  { value: 'school', label: 'School Admission' }
]

const modelOptions = [
  { value: 'claude', label: 'Claude', version: '3.5 Haiku' },
  { value: 'deepseek', label: 'Deepseek', version: 'Coder' }
]

// Toggle dropdown functions
const toggleGoalDropdown = () => {
  showGoalDropdown.value = !showGoalDropdown.value
  if (showGoalDropdown.value) {
    showModelDropdown.value = false
  }
}

const toggleModelDropdown = () => {
  showModelDropdown.value = !showModelDropdown.value
  if (showModelDropdown.value) {
    showGoalDropdown.value = false
  }
}

// Selection functions
const selectGoal = (value) => {
  formData.goal = value
  showGoalDropdown.value = false
  // Save preference to cookie
  cookies.set('userGoal', value)
}

const selectModel = (value) => {
  if (apiAvailability[value]) {
    formData.model = value
  }
  showModelDropdown.value = false
}

// Close dropdowns when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    showGoalDropdown.value = false
    showModelDropdown.value = false
  }
}

// Add event listener for clicks outside dropdowns
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// Remove event listener on component unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const newTag = ref('')

const addTag = () => {
  if (newTag.value.trim()) {
    formData.additionalInfoTags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index) => {
  formData.additionalInfoTags.splice(index, 1)
}

const loading = ref(false)
const error = ref('')
const apiAvailability = reactive({
  claude: false,
  deepseek: false
})

const toggleIdCard = () => {
  // Access the IdCard component through the ref and toggle it
  if (props.idCardRef) {
    props.idCardRef.toggleSidebar()
  }
}

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/check-availability')
    Object.assign(apiAvailability, response.data)
    
    // Set default model to the first available one
    if (!apiAvailability.claude && apiAvailability.deepseek) {
      formData.model = 'deepseek'
    } else if (apiAvailability.claude) {
      formData.model = 'claude'
    }
    
    // Load user preferences from cookies
    const savedGoal = cookies.get('userGoal')
    if (savedGoal && ['job', 'internship', 'school'].includes(savedGoal)) {
      formData.goal = savedGoal
    }
    
  } catch (error) {
    console.error('Failed to check API availability:', error)
  }
})

// Watch for changes in user preferences and save to cookies
watch(() => formData.goal, (newGoal) => {
  cookies.set('userGoal', newGoal, '1y')
})

watch(() => formData.model, (newModel) => {
  cookies.set('userModel', newModel, '1y')
})

const generateLetter = async () => {
  // Prevent duplicate calls if already loading
  if (loading.value) return;
  
  error.value = ''
  loading.value = true
  try {
    console.log('Generating letter with model:', formData.model);
    // Set the model in the letter store
    letterStore.setModel(formData.model);
    
    const response = await axios.post('http://localhost:3000/api/generate', {
      destination: formData.destination,
      goal: formData.goal,
      additionalInfo: formData.additionalInfoTags.join(', '),
      model: formData.model,
      language: props.language
    })
    letterStore.setLetter(response.data.letter)
  } catch (err) {
    console.error('Error generating letter:', err)
    error.value = err.response?.data?.error || 'Failed to generate letter. Please try again.'
  } finally {
    loading.value = false
  }
}
</script> 