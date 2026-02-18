import axios from 'axios';
import { format, addDays, addMinutes } from 'date-fns';

// --- HELPERS ---
const cleanUrl = (url?: string) => url?.replace(/\/$/, '') || '';

// Remove caracteres não numéricos (Retorna apenas dígitos)
const onlyNumbers = (str: string) => str.replace(/\D/g, '');

// Remove o DDI (55) se existir, mantendo apenas DDD + Número (11 dígitos)
// Isso ajuda a evitar Overflow se o banco usar campos numéricos limitados
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

// IDs de Contexto
const FACILITY_ID = process.env.CLINIC_FACILITY_ID || '1';
const DOCTOR_ID = process.env.CLINIC_DOCTOR_ID || '10073';
const ADDRESS_ID = process.env.CLINIC_ADDRESS_ID || '1';

// --- INTERFACES ---
interface CrmToken {
  accessToken: string;
  expiresAt: number;
}

export interface ClinicPatientData {
  name: string;
  mobile: string;
  birthday?: string; // YYYY-MM-DD
  sex?: "M" | "F";
  email?: string;
  nin?: string; // CPF
  healthInsuranceCode?: number;
  address?: string;
  addressNumber?: string;
  zipCode?: string;
}

// Cache Global
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

  // --- MÉTODOS DE PACIENTE ---

  public async upsertPatient(data: ClinicPatientData) {
    if (!BASE_URL) throw new Error("URL da API não configurada.");
    
    try {
      const token = await this.getAccessToken();
      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/patients`;

      // CORREÇÃO: Enviar NIN (CPF) sem formatação para passar na validação "required"
      const rawNin = data.nin ? onlyNumbers(data.nin) : ""; 
      const cleanMobile = formatMobileLegacy(data.mobile); 

      const payload = {
        name: data.name,
        mobile: cleanMobile, 
        birthday: data.birthday,
        sex: data.sex || "M",
        email: data.email || "",
        nin: rawNin, // SOMENTE NÚMEROS
        maritalStatus: 3, 
        healthInsuranceCode: data.healthInsuranceCode || 2,
        address: data.address || "Rua",
        addressNumber: data.addressNumber || "S/N",
        zipCode: data.zipCode ? onlyNumbers(data.zipCode) : "00000000",
        external_id: ""
      };

      console.log(`👤 Upsert Patient Payload:`, JSON.stringify(payload, null, 2));

      const response = await axios.post(url, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.data.result;

    } catch (error: any) {
      const sqlError = error.response?.data?.error;
      const validationError = error.response?.data?.errors;

      if (validationError) {
         console.error("❌ Erro Validação Clinic:", JSON.stringify(validationError, null, 2));
         throw new Error(`Erro de Validação: ${JSON.stringify(validationError)}`);
      }
      
      if (sqlError) {
          console.error("❌ Erro SQL Server Clinic:", JSON.stringify(sqlError, null, 2));
          if (sqlError.number === 8115) {
             throw new Error("Erro de Overflow: O sistema da clínica recusou o tamanho do CPF ou Telefone.");
          }
      }
      
      console.error("❌ Erro Upsert Patient:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Erro ao salvar paciente no CRM.");
    }
  }

  public async findPatients(query: string) {
    if (!BASE_URL) return [];
    try {
      const token = await this.getAccessToken();
      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/patients`;
      
      // Busca apenas números se parecer CPF/Phone, senão texto livre
      const searchTerm = /[0-9]{3}/.test(query) ? onlyNumbers(query) : query;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { search: searchTerm } 
      });

      return response.data.result?.items || [];
    } catch (error: any) {
      console.error("❌ Erro Find Patient:", error.response?.data || error.message);
      return [];
    }
  }

  // --- MÉTODOS DE AGENDA ---

  public async getHealthInsurances() {
    if (!BASE_URL) return [];
    try {
      const token = await this.getAccessToken();
      const url = `${BASE_URL}/api/v1/integration/insurance-providers`;
      const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const items = response.data.result?.items || [];
      return items.filter((item: any) => item.status === true).map((item: any) => ({ id: item.id, name: item.name }));
    } catch (error: any) {
      console.error("❌ Erro Insurances:", error.message);
      return [];
    }
  }

  public async getAvailableSlots(startDate: Date, days: number = 7) {
    if (!BASE_URL) return [];
    try {
      const token = await this.getAccessToken();
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(addDays(startDate, days), "yyyy-MM-dd");
      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/available-slots`;

      console.log(`📡 GET Slots: ${startStr} a ${endStr}`);

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      const rawItems = response.data.result?.items || [];
      
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
      throw error;
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

      console.log(`📝 POST Booking: ${url}`, payload);

      const response = await axios.post(url, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log(`✅ Agendamento Confirmado! ID: ${response.data.id}`);

      return {
        success: true,
        bookingId: response.data.id || 'external-id',
        time: date
      };

    } catch (error: any) {
      console.error("❌ Erro Create Booking:", error.response?.data || error.message);
      const apiMsg = error.response?.data?.message;
      throw new Error(apiMsg ? `Clínica recusou: ${apiMsg}` : "Erro ao conectar com a agenda da clínica.");
    }
  }
}

export const clinicService = new ClinicService();

export const getClinicAvailableSlots = (startDate: Date, days: number = 7) => clinicService.getAvailableSlots(startDate, days);
export const getClinicBookings = (startDate: Date, days: number = 7) => clinicService.getBookings(startDate, days);