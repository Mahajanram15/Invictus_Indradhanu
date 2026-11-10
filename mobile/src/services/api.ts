import { CONFIG } from '../constants/config';
import { StorageService } from './storage';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  isOfflineCache?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json?.detail || json?.error?.message || `HTTP Error ${response.status}`;
      return { error: errorMsg };
    }

    return { data: json };
  } catch (error: any) {
    return {
      error: error.name === 'AbortError' ? 'Request timed out' : (error.message || 'Network request failed'),
    };
  }
}

// The backend's Farm model uses `name` / `acreage`; the mobile app's Farm
// type (see AuthContext) uses `farm_name` / `size_acres`. Normalize at the
// API boundary so the rest of the app can keep using its existing shape.
function normalizeFarm(raw: any): any {
  if (!raw) return raw;
  return {
    ...raw,
    farm_name: raw.farm_name ?? raw.name,
    size_acres: raw.size_acres ?? raw.acreage,
  };
}

export const ApiService = {
  // Farmer endpoints
  async getFarmerProfile(): Promise<ApiResponse<any>> {
    return request('/farmers/me');
  },

  async registerFarmer(data: {
    full_name: string;
    village: string;
    district: string;
    state?: string;
    preferred_language: string;
    phone_number?: string;
    email?: string;
    latitude: number;
    longitude: number;
    farm_acreage?: number;
  }): Promise<ApiResponse<any>> {
    return request('/auth/register-farmer', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        country: 'India',
        farm_name: 'Main Farm Plot',
        farm_acreage: data.farm_acreage ?? 2.5,
        soil_type: 'Black Cotton Soil',
        irrigation_source: 'Borewell / Drip',
      }),
    });
  },

  // Farms endpoints
  async getFarms(): Promise<ApiResponse<any[]>> {
    const res = await request<any[]>('/farms/me');
    if (res.data) {
      return { ...res, data: res.data.map(normalizeFarm) };
    }
    return res;
  },

  async createFarm(data: {
    farm_name: string;
    latitude: number;
    longitude: number;
    size_acres: number;
    soil_type?: string;
  }): Promise<ApiResponse<any>> {
    const res = await request<any>('/farms/me', {
      method: 'POST',
      body: JSON.stringify({
        name: data.farm_name,
        latitude: data.latitude,
        longitude: data.longitude,
        acreage: data.size_acres,
        soil_type: data.soil_type,
      }),
    });
    if (res.data) {
      return { ...res, data: normalizeFarm(res.data) };
    }
    return res;
  },

  // Crops catalog & Farm Crops
  async getCropsCatalog(): Promise<ApiResponse<any[]>> {
    return request('/crops');
  },

  async getCropDetails(cropId: string): Promise<ApiResponse<any>> {
    return request(`/crops/${cropId}`);
  },

  async getFarmCrops(farmId: string): Promise<ApiResponse<any[]>> {
    return request(`/farms/${farmId}/crops`);
  },

  async addFarmCrop(
    farmId: string,
    data: {
      crop_id: string;
      variety?: string;
      sowing_date: string;
      current_stage_id?: string;
      current_stage_name?: string;
      cultivated_acreage?: number;
      allocated_acres?: number;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    const payload = {
      ...data,
      cultivated_acreage: data.cultivated_acreage ?? data.allocated_acres ?? 1.0,
    };
    return request(`/farms/${farmId}/crops`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCropStage(
    farmId: string,
    farmCropId: string,
    stageId: string
  ): Promise<ApiResponse<any>> {
    return request(`/farms/${farmId}/crops/${farmCropId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ current_stage_id: stageId }),
    });
  },

  // Climate data
  async getFarmClimateCurrent(farmId: string): Promise<ApiResponse<any>> {
    return request(`/farms/${farmId}/climate/current`);
  },

  async getFarmClimateForecast(farmId: string): Promise<ApiResponse<any>> {
    return request(`/farms/${farmId}/climate/forecast`);
  },

  // Risk assessment
  async getCropRisk(farmId: string, farmCropId?: string): Promise<ApiResponse<any>> {
    return request(`/farms/${farmId}/risk/latest`);
  },

  // Advisories (with Offline Cache Fallback)
  async getLatestAdvisory(farmId: string, cropId?: string, language?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (cropId) params.set('crop_id', cropId);
    if (language) params.set('language', language);
    const qs = params.toString();
    const res = await request<any>(`/advisories/farms/${farmId}/latest${qs ? `?${qs}` : ''}`);
    if (res.data) {
      // Cache this latest advisory for offline use
      const cached = await StorageService.getCachedAdvisories();
      const updated = [res.data, ...cached.filter((a) => a.id !== res.data.id)].slice(0, 20);
      await StorageService.saveCachedAdvisories(updated);
      return res;
    }

    // Network failed or offline - fallback to offline cache
    const offlineList = await StorageService.getCachedAdvisories();
    const match = offlineList.find((a) => a.farm_id === farmId);
    if (match) {
      return { data: match, isOfflineCache: true };
    }
    return res;
  },

  async generateAdvisory(
    farmId: string,
    language?: string,
    cropId?: string,
    stageId?: string
  ): Promise<ApiResponse<any>> {
    return request('/advisories/generate', {
      method: 'POST',
      body: JSON.stringify({ farm_id: farmId, language, crop_id: cropId, stage_id: stageId }),
    });
  },

  async getAdvisoriesHistory(farmId: string): Promise<ApiResponse<any[]>> {
    const res = await request<any[]>(`/advisories/?farm_id=${farmId}`);
    if (res.data && Array.isArray(res.data)) {
      await StorageService.saveCachedAdvisories(res.data);
      return res;
    }
    // Return offline cached list if available
    const offline = await StorageService.getCachedAdvisories();
    if (offline.length > 0) {
      return { data: offline, isOfflineCache: true };
    }
    return res;
  },

  // Feedback on advisory
  async submitAdvisoryFeedback(
    advisoryId: string,
    data: {
      action_taken: string;
      water_saved_liters?: number;
      cost_saved_inr?: number;
      feedback_notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return request(`/admin/advisories/${advisoryId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Notification / Delivery Preferences & Dispatch
  async dispatchAdvisory(
    advisoryId: string,
    channels: string[] = ['SMS']
  ): Promise<ApiResponse<any>> {
    return request('/deliveries/dispatch', {
      method: 'POST',
      body: JSON.stringify({ advisory_id: advisoryId, channels, simulate: true }),
    });
  },

  async getDeliveryPreferences(): Promise<ApiResponse<any>> {
    return request('/deliveries/preferences');
  },

  async updateDeliveryPreferences(data: {
    preferred_channel: string;
    sms_enabled: boolean;
    voice_enabled: boolean;
    whatsapp_enabled: boolean;
  }): Promise<ApiResponse<any>> {
    return request('/deliveries/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getDeliveryHistory(): Promise<ApiResponse<any[]>> {
    return request('/deliveries/history');
  }
};
