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

// Cache Global para evitar re-autenticação a cada request
declare global {
  var clinicTokenCache: CrmToken | null;
}

let cachedToken: CrmToken | null = global.clinicTokenCache || null;

class ClinicService {
  
  /**
   * Autenticação Robusta (OAuth Client Credentials)
   */
  private async getAccessToken(): Promise<string> {
    if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
      console.error("❌ ERRO CRÍTICO: Credenciais CLINIC_* ausentes no .env");
      throw new Error("Credenciais do Clinic (CLINIC_*) não configuradas no .env");
    }

    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      // console.log("🔄 Usando Token CRM em Cache");
      return cachedToken.accessToken;
    }

    console.log("🔐 Autenticando com API Clinic...");
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
      
      console.log("✅ Autenticado com Sucesso!");

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

  /**
   * Busca Lista de Convênios Ativos
   */
  public async getHealthInsurances() {
    if (!BASE_URL) return [];

    try {
      const token = await this.getAccessToken();
      const url = `${BASE_URL}/api/v1/integration/insurance-providers`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const items = response.data.result?.items || [];
      
      return items
        .filter((item: any) => item.status === true)
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .map((item: any) => ({
          id: item.id,
          name: item.name
        }));

    } catch (error: any) {
      console.error("❌ Erro Get Insurances:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Busca Slots Livres (Disponíveis)
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

      console.log(`🔎 [ClinicService] Consultando Slots de ${startStr} a ${endStr}...`);

      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/available-slots`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      const rawItems = response.data.result?.items || [];
      
      console.log(`📊 [ClinicService] Retornou ${rawItems.length} slots livres.`);

      // Mapeamento correto
      return rawItems.map((isoString: string) => {
        const startTime = new Date(isoString);
        const endTime = addMinutes(startTime, 30); // Duração padrão se API não informar

        return {
          id: `clinic-free-${isoString}`, // ID Único
          startTime: startTime,
          endTime: endTime,
          isBooked: false,
          source: 'CLINIC',
          details: 'Disponível no ERP'
        };
      });

    } catch (error: any) {
      console.error("❌ Erro Clinic Available:", error.response?.data || error.message);
      throw new Error(`Erro ao consultar API da clínica: ${error.message}`);
    }
  }

  /**
   * Busca Agendamentos (Ocupados)
   */
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
        source: 'CLINIC',
        details: booking.client || booking.patient?.name || "Paciente Agendado"
      }));

    } catch (error: any) {
      console.error("❌ Erro Clinic Bookings:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * NOVO: Cria um agendamento na API externa
   * Usado pela Silvia para confirmar marcação
   */
  public async createBooking(date: Date, patient: { name: string; phone: string; birthDate?: Date | null }) {
    if (!BASE_URL) throw new Error("URL da API não configurada.");

    try {
      const token = await this.getAccessToken();
      
      // Regra de negócio: Duração fixa de 30 minutos
      const endDate = addMinutes(date, 30);

      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/bookings`;

      // Payload padrão para CRM (formatação estrita yyyy-MM-dd HH:mm:ss)
      const payload = {
        start_date: format(date, "yyyy-MM-dd HH:mm:ss"),
        end_date: format(endDate, "yyyy-MM-dd HH:mm:ss"),
        note: "Agendado via Silvia (Encaixe Já)",
        patient: {
          name: patient.name,
          mobile_phone: patient.phone, // Formato esperado pelo CRM
          // Se tiver data de nascimento, formata yyyy-MM-dd, senão null
          birth_date: patient.birthDate ? format(patient.birthDate, "yyyy-MM-dd") : null
        }
      };

      console.log(`📝 [ClinicService] Enviando Agendamento: ${payload.start_date} - ${patient.name}`);

      const response = await axios.post(url, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log(`✅ [ClinicService] Agendamento Confirmado! ID: ${response.data.id}`);

      return {
        success: true,
        bookingId: response.data.id || 'external-id',
        time: date
      };

    } catch (error: any) {
      console.error("❌ Erro Create Booking:", error.response?.data || error.message);
      
      // Captura mensagem de erro específica da API para repassar ao usuário
      const apiMessage = error.response?.data?.message;
      const finalMessage = apiMessage ? `A clínica recusou o agendamento: ${apiMessage}` : "Erro de conexão com a agenda da clínica.";
      
      throw new Error(finalMessage);
    }
  }
}

// --- EXPORTS ---

// 1. Instância principal (singleton) para usar métodos da classe
export const clinicService = new ClinicService();

// 2. Funções soltas (Wrappers) para compatibilidade com códigos legados
export const getClinicAvailableSlots = (startDate: Date, days: number = 7) => clinicService.getAvailableSlots(startDate, days);
export const getClinicBookings = (startDate: Date, days: number = 7) => clinicService.getBookings(startDate, days);