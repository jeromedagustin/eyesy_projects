/**
 * Settings Storage - Persists user settings to IndexedDB
 */
export interface AppSettings {
  // Transition settings
  transitionsEnabled: boolean;
  transitionDuration: number;
  transitionType: string | null;
  
  // Knob values
  knob1: number;
  knob2: number;
  knob3: number;
  knob4: number;
  knob5: number;
  knob6: number;
  knob7: number;
  knob8: number;
  knob9: number;
  knob10: number;
  
  // Feature toggles
  autoClear: boolean;
  randomSequenceEnabled: boolean;
  randomSequenceFrequency: number;
  randomColorEnabled: boolean;
  randomColorFrequency: number;
  randomTriggerEnabled: boolean;
  randomTriggerFrequency: number;
  mockAudioEnabled: boolean;
  mockAudioFrequency: number;
  mockAudioIntensityRandomness: number;
  
  // Knob lock states (for random mode)
  knob1Locked: boolean;
  knob2Locked: boolean;
  knob3Locked: boolean;
  knob4Locked: boolean;
  knob5Locked: boolean;
  knob6Locked: boolean;
  knob7Locked: boolean;
  knob9Locked: boolean;
  knob10Locked: boolean;
  
  // Microphone settings
  micGain: number;
  useMicrophone: boolean;
  
  // Webcam settings
  webcamPermissionGranted: boolean;
  webcamEnabled: boolean;
  webcamLayerPosition: 'background' | 'foreground';
  webcamOpacity: number;
  webcamBlendMode: string;
  webcamChromaKeyEnabled: boolean;
  webcamChromaKeyColor: [number, number, number];
  webcamChromaKeyTolerance: number;
  webcamChromaKeySmoothness: number;
  webcamScale: number;
  webcamPositionX: number;
  webcamPositionY: number;
  webcamRotation: number;
  webcamMirror: boolean;
  
  // UI settings
  leftHanded: boolean; // Controls panel on left (true) or right (false)
  portraitRotate: boolean; // Rotate animation 90° in portrait mode
  
  // Font settings (for font modes)
  fontFamily: string; // Font family name (e.g., 'Arial', 'Times New Roman')
  fontText: string; // Custom text to display in font modes (empty = use default unicode characters)
  
  // Seizure-safe mode settings (per-mode)
  seizureSafeMode: { [modeId: string]: boolean }; // Mode-specific seizure-safe mode enabled/disabled
  
  // Favorites
  favorites: string[]; // Array of favorite mode IDs
  showOnlyFavorites: boolean; // Show only favorites in browser/navigation
  
  // Performance settings
  targetFPS: number; // Target frame rate (1-60, 0 = unlimited)

  // Effect settings
  activeEffects: { [effectName: string]: { enabled: boolean; intensity: number; [key: string]: any } };
  effectsBlendMix: number; // Overall blend mix (0.0 = original, 1.0 = full effects)
}

const DB_NAME = 'eyesy-settings';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

export class SettingsStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Save settings to IndexedDB
   */
  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Get existing settings and merge
      const getRequest = store.get('app-settings');
      getRequest.onsuccess = () => {
        const existing = getRequest.result || {};
        const merged = { ...existing, ...settings };
        
        const putRequest = store.put(merged, 'app-settings');
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Load settings from IndexedDB
   */
  async loadSettings(): Promise<Partial<AppSettings> | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('app-settings');

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all settings
   */
  async clearSettings(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete('app-settings');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

