import axios from 'axios';
import { format, addDays } from 'date-fns';

// --- INTERFACES ---
interface CrmToken {
  accessToken: string;
  expiresAt: number;
}

interface ClinicSlot {
  id: string; // O ID do slot na Clinic (ex: "2023-10-25T14:00:00")
  start: string;
  end: string;
  status: boolean; // true = livre? ou o contrário? Vamos analisar o response
}

class ClinicService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  
  // Cache de Token em memória (Serverless friendly se container warm)
  private cachedToken: CrmToken | null = null;

  // IDs Fixos do Médico (Marco) para este MVP
  // Em um SaaS real, isso viria do banco de dados (User.clinicDoctorId)
  private readonly FACILITY_ID = 1;
  private readonly DOCTOR_ID = 10073; 
  private readonly ADDRESS_ID = 1;

  constructor() {
    this.baseUrl = process.env.CLINIC_API_URL || "https://legacy-479-caib.clinic.inf.br";
    this.clientId = process.env.CLINIC_CLIENT_ID || "i-legacy-otorrinos@clinic.inf.br";
    this.clientSecret = process.env.CLINIC_CLIENT_SECRET || "tdZli3vW014C6ZqWsf7imtUrsb70dYspMd1WRE3o6BFoR";
  }

  /**
   * Obtém Token OAuth2 (Client Credentials)
   */
  private async getAccessToken(): Promise<string> {
    // Se o token existe e não expira no próximo minuto, usa ele
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const tokenUrl = `${this.baseUrl}/oauth/v1/token`;
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await axios.post(tokenUrl, {}, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      const { access_token, expires_in } = response.data;
      
      this.cachedToken = {
        accessToken: access_token,
        expiresAt: Date.now() + (expires_in - 60) * 1000 // Margem de segurança
      };

      return access_token;
    } catch (error: any) {
      console.error("❌ Erro Auth Clinic:", error.response?.data || error.message);
      throw new Error("Falha na autenticação com o CRM Clinic.");
    }
  }

  /**
   * Busca Slots Disponíveis (LIVRES)
   */
  public async getAvailableSlots(startDate: Date, days: number = 7) {
    try {
      const token = await this.getAccessToken();
      
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(addDays(startDate, days), "yyyy-MM-dd");

      const url = `${this.baseUrl}/api/v1/integration/facilities/${this.FACILITY_ID}/doctors/${this.DOCTOR_ID}/addresses/${this.ADDRESS_ID}/available-slots`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { start_date: startStr, end_date: endStr },
      });

      // O retorno costuma ser { result: { items: [...] } } ou direto array
      const items = response.data.result?.items || response.data || [];

      // Mapeia para o formato unificado do nosso sistema
      return items.map((slot: any) => ({
        id: slot.id || slot.start, // Se não tiver ID único, usa o timestamp
        startTime: new Date(slot.start),
        endTime: new Date(slot.end),
        isBooked: false, // Se veio de "available-slots", está livre
        source: 'CLINIC',
        details: 'Disponível no ERP'
      }));

    } catch (error: any) {
      console.error("❌ Erro Get Slots Clinic:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Busca Agendamentos (OCUPADOS)
   * Importante para mostrar na agenda o que já está tomado
   */
  public async getBookings(startDate: Date, days: number = 7) {
    try {
        const token = await this.getAccessToken();
        const startStr = format(startDate, "yyyy-MM-dd");
        const endStr = format(addDays(startDate, days), "yyyy-MM-dd");
  
        const url = `${this.baseUrl}/api/v1/integration/facilities/${this.FACILITY_ID}/doctors/${this.DOCTOR_ID}/addresses/${this.ADDRESS_ID}/bookings`;
  
        const response = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { start_date: startStr, end_date: endStr },
        });
  
        const items = response.data.result?.items || [];
  
        return items.map((booking: any) => ({
          id: `booked-${booking.id}`,
          startTime: new Date(booking.date + 'T' + booking.start_time), // Ajuste conforme formato real (ISO ou date+time separados)
          // Se a API retornar start/end ISO, use new Date(booking.start)
          endTime: new Date(booking.date + 'T' + booking.end_time),
          isBooked: true,
          source: 'CLINIC',
          details: booking.client || booking.patient?.name || "Paciente ERP"
        }));
  
      } catch (error: any) {
        console.error("❌ Erro Get Bookings Clinic:", error.response?.data || error.message);
        return [];
      }
  }
}

export const clinicService = new ClinicService();