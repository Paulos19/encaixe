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
      throw new Error("Credenciais do Clinic (CLINIC_*) não configuradas no .env");
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

  /**
   * Busca Lista de Convênios Ativos
   * Usado no cadastro manual e importação
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
      
      // Filtra apenas ativos e ordena alfabeticamente
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
    if (!BASE_URL) return [];

    try {
      const token = await this.getAccessToken();
      
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(addDays(startDate, days), "yyyy-MM-dd");

      const url = `${BASE_URL}/api/v1/integration/facilities/${FACILITY_ID}/doctors/${DOCTOR_ID}/addresses/${ADDRESS_ID}/available-slots`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      // O retorno da API é { result: { items: string[] } } -> Array de ISO Strings
      const rawItems = response.data.result?.items || [];

      // Mapeamento correto
      return rawItems.map((isoString: string) => {
        const startTime = new Date(isoString);
        // Assume duração de 30min se a API não fornecer
        const endTime = addMinutes(startTime, 30); 

        return {
          id: `clinic-free-${isoString}`,
          startTime: startTime,
          endTime: endTime,
          isBooked: false,
          source: 'CLINIC',
          details: 'Disponível no ERP'
        };
      });

    } catch (error: any) {
      console.error("❌ Erro Clinic Available:", error.response?.data || error.message);
      return [];
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
        // Tratamento robusto para data/hora
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
}

// --- EXPORTS ---

// 1. Instância principal (singleton) para usar métodos da classe
export const clinicService = new ClinicService();

// 2. Funções soltas (Wrappers) para compatibilidade com códigos legados (Agenda, Debug, etc)
export const getClinicAvailableSlots = (startDate: Date, days: number = 7) => clinicService.getAvailableSlots(startDate, days);
export const getClinicBookings = (startDate: Date, days: number = 7) => clinicService.getBookings(startDate, days);