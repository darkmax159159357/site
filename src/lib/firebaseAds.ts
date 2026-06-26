import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AdConfig {
  adSlots: {
    afterContent1: string;
    afterContent2: string;
    beforeContent1: string;
    beforeContent2: string;
    content1: string;
    content2: string;
    sidebar: string;
    sticky: string;
    widget: string;
  };
  adsTxt: string;
  adsense: string;
  analytics: string;
  head: string;
}

const DEFAULT_AD_CONFIG: AdConfig = {
  adSlots: {
    afterContent1: '',
    afterContent2: '',
    beforeContent1: '',
    beforeContent2: '',
    content1: '',
    content2: '',
    sidebar: '',
    sticky: '',
    widget: '',
  },
  adsTxt: '',
  adsense: '',
  analytics: '',
  head: '',
};

/**
 * Fetches the ad configuration from Firebase
 */
export async function getAdConfig(): Promise<AdConfig> {
  try {
    const docRef = doc(db, 'ads_config', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AdConfig;
    }
    
    console.warn('No ad configuration found in Firebase');
    return DEFAULT_AD_CONFIG;
  } catch (error) {
    console.error('Error fetching ad configuration:', error);
    return DEFAULT_AD_CONFIG;
  }
} 