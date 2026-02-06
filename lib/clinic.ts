import axios from 'axios';
import { format, addDays, addMinutes } from 'date-fns';

// --- CONFIGURAÇÃO ---
const BASE_URL = process.env.CLINIC_API_URL || process.env.LEGACY_URL;
const CLIENT_ID = process.env.CLINIC_CLIENT_ID || process.env.LEGACY_CLIENT_ID;
const CLIENT_SECRET = process.env.CLINIC_CLIENT_SECRET || process.env.LEGACY_CLIENT_SECRET;

const FACILITY_ID = 1;
const DOCTOR_ID = 10073; 
const ADDRESS_ID = 1;

// --- INTERFACES ---
interface CrmToken {
  accessToken: string;
  expiresAt: number;
}

// Cache Global
declare global {
  var clinicTokenCache: CrmToken | null;
}

let cachedToken: CrmToken | null = global.clinicTokenCache || null;

class ClinicService {
  
  private async getAccessToken(): Promise<string> {
    if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
      console.error("❌ ERRO: Credenciais CLINIC_* ausentes no .env");
      throw new Error("Configuração da API da Clínica incompleta.");
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
      throw new Error("Falha na autenticação com o CRM da Clínica.");
    }
  }

  /**
   * Busca Slots Livres
   */
  public async getAvailableSlots(startDate: Date, days: number = 7) {
    if (!BASE_URL) {
      console.warn("⚠️ AVISO: CLINIC_API_URL não definida. Retornando vazio.");
      return [];
    }

    try {
      const token = await this.getAccessToken();
      
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(addDays(startDate, days), "yyyy-MM-dd");

      console.log(`🔎 Consultando Clinic de ${startStr} a ${endStr} (${days} dias)...`);

      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/available-slots`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      const rawItems = response.data.result?.items || [];
      console.log(`✅ Clinic retornou ${rawItems.length} slots.`);

      return rawItems.map((isoString: string) => ({
        startTime: new Date(isoString),
        source: 'CLINIC' as const 
      }));

    } catch (error: any) {
      console.error("❌ Erro Clinic Available:", error.response?.data || error.message);
      // Lança o erro para que a Silvia saiba que falhou, em vez de achar que não tem vagas
      throw new Error(`Erro ao consultar API da clínica: ${error.message}`);
    }
  }

  /**
   * Cria Agendamento
   */
  public async createBooking(date: Date, patient: { name: string; phone: string; birthDate?: Date | null }) {
    if (!BASE_URL) throw new Error("URL da API não configurada.");

    try {
      const token = await this.getAccessToken();
      const endDate = addMinutes(date, 30);

      const payload = {
        start_date: format(date, "yyyy-MM-dd HH:mm:ss"),
        end_date: format(endDate, "yyyy-MM-dd HH:mm:ss"),
        note: "Agendado via Silvia (Encaixe Já)",
        patient: {
          name: patient.name,
          mobile_phone: patient.phone,
          birth_date: patient.birthDate ? format(patient.birthDate, "yyyy-MM-dd") : null
        }
      };

      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/bookings`;

      const response = await axios.post(url, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      return {
        success: true,
        bookingId: response.data.id || 'external-id',
        time: date
      };

    } catch (error: any) {
      console.error("❌ Erro Create Booking:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Erro ao conectar com a agenda da clínica.");
    }
  }
}

export const clinicService = new ClinicService();