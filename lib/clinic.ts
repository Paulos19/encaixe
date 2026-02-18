import axios from 'axios';
import { format, addDays, addMinutes } from 'date-fns';

// --- HELPERS ---
const cleanUrl = (url?: string) => url?.replace(/\/$/, '') || '';
const onlyNumbers = (str: string) => str.replace(/\D/g, '');

const formatCPF = (cpf: string) => {
  const nums = onlyNumbers(cpf);
  if (nums.length !== 11) return nums;
  return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatMobileLegacy = (phone: string) => {
  let nums = onlyNumbers(phone);
  if (nums.startsWith('55') && nums.length >= 12) {
    nums = nums.substring(2);
  }
  return nums;
};

// --- CONFIGURAÇÃO ---
const BASE_URL = cleanUrl(process.env.CLINIC_API_URL || process.env.LEGACY_URL);
const CLIENT_ID = process.env.CLINIC_CLIENT_ID || process.env.LEGACY_CLIENT_ID;
const CLIENT_SECRET = process.env.CLINIC_CLIENT_SECRET || process.env.LEGACY_CLIENT_SECRET;

const FACILITY_ID = process.env.CLINIC_FACILITY_ID || '1';
const DOCTOR_ID = process.env.CLINIC_DOCTOR_ID || '10073';
const ADDRESS_ID = process.env.CLINIC_ADDRESS_ID || '1';

// CBO Padrão (Psiquiatria = 225133, Clínico = 225170)
const SPECIALTY_CBO = process.env.CLINIC_SPECIALTY_CBO || '225133'; 

interface CrmToken {
  accessToken: string;
  expiresAt: number;
}

export interface ClinicPatientData {
  name: string;
  mobile: string;
  birthday?: string;
  sex?: "M" | "F";
  email?: string;
  nin?: string;
  healthInsuranceCode?: number;
  address?: string;
  addressNumber?: string;
  zipCode?: string;
}

declare global {
  var clinicTokenCache: CrmToken | null;
}

let cachedToken: CrmToken | null = global.clinicTokenCache || null;

class ClinicService {
  
  private async getAccessToken(): Promise<string> {
    if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("Credenciais do Clinic não configuradas.");
    }

    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      return cachedToken.accessToken;
    }

    const tokenUrl = `${BASE_URL}/oauth/v1/token`;
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    try {
      const response = await axios.post(tokenUrl, {}, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      const { access_token, expires_in } = response.data;
      
      cachedToken = {
        accessToken: access_token,
        expiresAt: Date.now() + (expires_in - 60) * 1000,
      };
      
      global.clinicTokenCache = cachedToken;
      return access_token;

    } catch (error: any) {
      console.error("❌ Erro Auth Clinic:", error.response?.data || error.message);
      throw new Error("Falha na autenticação com o CRM.");
    }
  }

  // --- FERRAMENTAS DE DIAGNÓSTICO (NOVO) ---

  /**
   * Retorna detalhes da Unidade (Facility), incluindo lista de médicos e especialidades.
   * Útil para descobrir o DOCTOR_ID correto e o SPECIALTY_CBO.
   */
  public async getFacilityDetails() {
    if (!BASE_URL) return null;
    try {
        const token = await this.getAccessToken();
        const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}`;
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return response.data.result;
    } catch (error: any) {
        console.error("Erro Get Facility:", error.message);
        throw error;
    }
  }

  /**
   * Tenta buscar slots pela ROTA DE ESPECIALIDADE (Documentada)
   * Útil se a rota direta do médico falhar.
   */
  public async getSlotsBySpecialty(startDate: Date, days: number = 7) {
    if (!BASE_URL) return [];
    try {
        const token = await this.getAccessToken();
        const startStr = format(startDate, "yyyy-MM-dd");
        const endStr = format(addDays(startDate, days), "yyyy-MM-dd");
        
        const params = new URLSearchParams({
            start_date: startStr,
            end_date: endStr,
            specialty_cbo: SPECIALTY_CBO, // Necessário configurar no .env
            health_insurance_id: "4" // Padrão 'Particular' ou similar
        });

        const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/available-slots-by-specialty?${params.toString()}`;
        console.log(`🔎 Testing Specialty Slots: ${url}`);

        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return response.data.result;
    } catch (error: any) {
        console.error("Erro Specialty Slots:", error.message);
        return [];
    }
  }

  // --- MÉTODOS ORIGINAIS ---

  public async upsertPatient(data: ClinicPatientData) {
    if (!BASE_URL) throw new Error("URL da API não configurada.");
    try {
      const token = await this.getAccessToken();
      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/patients`;

      const rawNin = data.nin ? onlyNumbers(data.nin) : ""; 
      const cleanMobile = formatMobileLegacy(data.mobile); 

      const payload = {
        name: data.name,
        mobile: cleanMobile, 
        birthday: data.birthday,
        sex: data.sex || "M",
        email: data.email || "",
        nin: rawNin,
        maritalStatus: 3, 
        healthInsuranceCode: data.healthInsuranceCode || 2,
        address: data.address || "Rua",
        addressNumber: data.addressNumber || "S/N",
        zipCode: data.zipCode ? onlyNumbers(data.zipCode) : "00000000",
        external_id: ""
      };

      const response = await axios.post(url, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.result;

    } catch (error: any) {
        const sqlError = error.response?.data?.error;
        const validationError = error.response?.data?.errors;
        if (validationError) throw new Error(`Erro de Validação: ${JSON.stringify(validationError)}`);
        if (sqlError && sqlError.number === 8115) throw new Error("Erro de Overflow (CPF/Tel).");
        throw new Error(error.response?.data?.message || "Erro ao salvar paciente.");
    }
  }

  public async findPatients(query: string) {
     if (!BASE_URL) return [];
     try {
       const token = await this.getAccessToken();
       const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/patients`;
       const searchTerm = /[0-9]{3}/.test(query) ? onlyNumbers(query) : query;
       const response = await axios.get(url, {
         headers: { 'Authorization': `Bearer ${token}` },
         params: { search: searchTerm } 
       });
       return response.data.result?.items || [];
     } catch (error: any) {
       console.error("Erro Find Patient:", error.message);
       return [];
     }
  }

  public async getHealthInsurances() {
      if (!BASE_URL) return [];
      try {
        const token = await this.getAccessToken();
        const url = `${BASE_URL}/api/v1/integration/insurance-providers`;
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return response.data.result?.items?.filter((i:any) => i.status).map((i:any) => ({ id: i.id, name: i.name })) || [];
      } catch (e) { return []; }
  }

  public async getAvailableSlots(startDate: Date, days: number = 7) {
    if (!BASE_URL) return [];
    try {
      const token = await this.getAccessToken();
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(addDays(startDate, days), "yyyy-MM-dd");
      
      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/available-slots`;

      console.log(`📡 GET Slots: ${url}?start_date=${startStr}&end_date=${endStr}`);

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      const rawItems = response.data.result?.items || [];
      
      if (rawItems.length === 0) {
          console.warn(`⚠️ API retornou 0 slots. Verifique: ADDRESS_ID=${ADDRESS_ID}, DOCTOR_ID=${DOCTOR_ID} ou se a agenda de ${startStr} está aberta.`);
      }

      return rawItems.map((isoString: string) => ({
        id: `clinic-free-${isoString}`, 
        startTime: new Date(isoString),
        endTime: addMinutes(new Date(isoString), 30),
        isBooked: false,
        source: 'CLINIC' as const,
        details: 'Disponível no ERP'
      }));

    } catch (error: any) {
      console.error(`❌ Erro Slots:`, error.message);
      return [];
    }
  }

  public async getBookings(startDate: Date, days: number = 7) {
    if (!BASE_URL) return [];

    try {
      const token = await this.getAccessToken();
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(addDays(startDate, days), "yyyy-MM-dd");

      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/bookings`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      const items = response.data.result?.items || [];

      return items.map((booking: any) => ({
        id: `clinic-booked-${booking.id}`,
        startTime: booking.start ? new Date(booking.start) : new Date(`${booking.date}T${booking.start_time}`),
        endTime: booking.end ? new Date(booking.end) : new Date(`${booking.date}T${booking.end_time}`),
        isBooked: true,
        source: 'CLINIC' as const,
        details: booking.client || booking.patient?.name || "Paciente Agendado"
      }));

    } catch (error: any) {
      console.error("❌ Erro Clinic Bookings:", error.response?.data || error.message);
      return [];
    }
  }

  public async createBooking(date: Date, patient: { name: string; phone: string; birthDate?: Date | null }) {
      if (!BASE_URL) throw new Error("URL da API não configurada.");
      try {
        const token = await this.getAccessToken();
        const endDate = addMinutes(date, 30);
        const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/bookings`;

        const payload = {
            start_date: format(date, "yyyy-MM-dd HH:mm:ss"),
            end_date: format(endDate, "yyyy-MM-dd HH:mm:ss"),
            note: "Agendado via Silvia (Encaixe Já)",
            patient: {
            name: patient.name,
            mobile_phone: formatMobileLegacy(patient.phone),
            birth_date: patient.birthDate ? format(patient.birthDate, "yyyy-MM-dd") : null
            }
        };
        const response = await axios.post(url, payload, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        return { success: true, bookingId: response.data.id || 'external-id', time: date };
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "Erro ao conectar com a agenda.");
      }
  }
}

export const clinicService = new ClinicService();
export const getClinicAvailableSlots = (startDate: Date, days: number = 7) => clinicService.getAvailableSlots(startDate, days);
export const getClinicBookings = (startDate: Date, days: number = 7) => clinicService.getBookings(startDate, days);