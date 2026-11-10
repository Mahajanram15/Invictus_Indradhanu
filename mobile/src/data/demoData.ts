import { FarmerProfile, Farm } from '../context/AuthContext';
import { SupportedLanguage } from '../localization/translations';

// Built-in sample data for the public demo deployment (EXPO_PUBLIC_DEMO_MODE),
// which has no live backend to call. Mirrors the kind of farmer, farm, crop,
// and advisory the real backend would return, so the walkthrough looks and
// reads the same as it would with a live API.

export const DEMO_FARMER_PROFILE: FarmerProfile = {
  id: 'demo-farmer-0001',
  auth_user_id: 'demo-auth-0001',
  phone_number: '+919823411209',
  full_name: 'Ramesh Patil',
  village: 'Baramati',
  district: 'Pune',
  state: 'Maharashtra',
  preferred_language: 'mr',
  role: 'farmer',
  trust_score: 92,
};

export const DEMO_FARM: Farm = {
  id: 'demo-farm-0001',
  farmer_id: 'demo-farmer-0001',
  farm_name: 'Main Farm Plot',
  latitude: 18.1519,
  longitude: 74.5772,
  size_acres: 2.5,
  soil_type: 'Black Cotton Soil',
  created_at: new Date().toISOString(),
};

export const DEMO_CROP = {
  id: 'demo-crop-maize',
  name: 'Maize (Corn)',
  scientific_name: 'Zea mays',
};

export const DEMO_FARM_CROP = {
  id: 'demo-farmcrop-0001',
  farm_id: DEMO_FARM.id,
  crop_id: DEMO_CROP.id,
  crop: DEMO_CROP,
  variety: 'Hybrid',
  cultivated_acreage: 1.5,
  sowing_date: new Date().toISOString().split('T')[0],
  current_stage_name: 'Germination & Early Seedling',
  status: 'active',
};

interface DemoAdvisory {
  immediate_action: string;
  why_it_matters: string;
  recommended_timing: string;
  risk_if_ignored: string;
  projected_impact: string;
  urgency: string;
}

// Mirrors the backend's multilingual_template_engine.py routine-irrigation
// directive, so the demo content reads identically to the real thing.
export const DEMO_ADVISORY: Record<SupportedLanguage, DemoAdvisory> = {
  mr: {
    immediate_action: 'Maize (Corn) पिकासाठी नेहमीचे ठरलेले सिंचन वेळापत्रक सुरू ठेवा.',
    why_it_matters: 'सध्याची हवामान स्थिती सामान्य आहे, मोठा पाऊस किंवा उष्णतेचा ताण अपेक्षित नाही.',
    recommended_timing: 'शांत सकाळी किंवा संध्याकाळी उशिरा',
    risk_if_ignored: 'कमी सिंचनामुळे पिकाच्या वाढीस विलंब होऊ शकतो.',
    projected_impact: 'पीक निरोगी वाढून वेळेवर परिपक्व होईल.',
    urgency: 'MODERATE',
  },
  hi: {
    immediate_action: 'Maize (Corn) के लिए सामान्य निर्धारित सिंचाई व्यवस्था जारी रखें।',
    why_it_matters: 'मौसम की स्थिति सामान्य है, भारी बारिश या गर्मी का तनाव अपेक्षित नहीं है।',
    recommended_timing: 'शांत सुबह या देर शाम के समय',
    risk_if_ignored: 'कम सिंचाई से फसल की वृद्धि में देरी हो सकती है।',
    projected_impact: 'फसल स्वस्थ रूप से बढ़कर समय पर परिपक्व होगी।',
    urgency: 'MODERATE',
  },
  te: {
    immediate_action: 'Maize (Corn) పంటను పరిశీలించి సలహా పాటించండి.',
    why_it_matters: 'వాతావరణ పరిస్థితుల వల్ల తెగుళ్ళ తీవ్రత పెరిగే అవకాశం ఉంది.',
    recommended_timing: 'రేపు ఉదయం వేళల్లో',
    risk_if_ignored: 'పంట నాణ్యత దెబ్బతినడం.',
    projected_impact: 'దిగుబడి రక్షణ.',
    urgency: 'MODERATE',
  },
  en: {
    immediate_action: 'Maintain standard scheduled irrigation regime for Maize (Corn).',
    why_it_matters: 'Weather parameters remain moderate with no severe precipitation or heat shock anticipated.',
    recommended_timing: 'During calm morning or late afternoon hours',
    risk_if_ignored: 'Under-irrigation may delay vegetative canopy growth.',
    projected_impact: 'Ensures steady phenological progression toward maturity.',
    urgency: 'MODERATE',
  },
};

export const DEMO_CLIMATE = {
  temperature_c: 29.5,
  humidity_pct: 62,
  precipitation_probability_pct: 12,
  wind_speed_kmh: 10,
};

export const DEMO_RISK_SCORES = {
  rainfall: 18,
  heat: 32,
  cold: 5,
  wind: 15,
  disease: 24,
  soil_moisture: 40,
};

export const DEMO_FORECAST_DAILY = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return {
    date: date.toISOString().split('T')[0],
    temp_max_c: 31 + (i % 3),
    temp_min_c: 21 + (i % 2),
    precipitation_probability_pct: [10, 15, 30, 20, 12, 8, 18][i],
    precipitation_mm: [0, 1, 4, 2, 0, 0, 1][i],
  };
});
