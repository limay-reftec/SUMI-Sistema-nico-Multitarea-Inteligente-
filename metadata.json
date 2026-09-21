/**
 * Google Workspace OAuth & Gmail API client helpers
 */

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export interface GoogleUserProfile {
  email: string;
  picture?: string;
  name?: string;
}

class GoogleAuthManager {
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private tokenClient: any = null;
  private userProfile: GoogleUserProfile | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('google_access_token');
      const savedExpiry = localStorage.getItem('google_token_expiry');
      const savedProfile = localStorage.getItem('google_user_profile');
      if (savedToken && savedExpiry) {
        const expiry = parseInt(savedExpiry, 10);
        if (Date.now() < expiry) {
          this.token = savedToken;
          this.tokenExpiresAt = expiry;
        }
      }
      if (savedProfile) {
        try {
          this.userProfile = JSON.parse(savedProfile);
        } catch {
          // ignore
        }
      }
    }
  }

  public getAccessToken(): string | null {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    return null;
  }

  public getUserProfile(): GoogleUserProfile | null {
    return this.userProfile;
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public logout(): void {
    this.token = null;
    this.tokenExpiresAt = 0;
    this.userProfile = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_token_expiry');
      localStorage.removeItem('google_user_profile');
    }
  }

  public async fetchClientId(): Promise<string> {
    try {
      const res = await fetch('/api/oauth/client-id');
      const data = await res.json();
      if (!data.clientId) {
        throw new Error('No client ID configured');
      }
      return data.clientId;
    } catch (err) {
      console.warn('Failed to fetch OAuth client id from server:', err);
      return '';
    }
  }

  public async initClient(): Promise<void> {
    if (this.tokenClient) return;

    const clientId = await this.fetchClientId();
    if (!clientId) {
      console.warn('Google Client ID not available yet');
      return;
    }

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return;
    }

    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: '', // defined at request time
    });
  }

  public async login(): Promise<string> {
    await this.initClient();

    if (!this.tokenClient) {
      throw new Error('El cliente de Google Identity Services aún no está listo. Verifica la conexión a internet.');
    }

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        const accessToken = response.access_token;
        const expiresIn = (response.expires_in || 3600) * 1000;
        this.token = accessToken;
        this.tokenExpiresAt = Date.now() + expiresIn;

        if (typeof window !== 'undefined') {
          localStorage.setItem('google_access_token', accessToken);
          localStorage.setItem('google_token_expiry', String(this.tokenExpiresAt));
        }

        // Fetch user profile
        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (profileRes.ok) {
            const prof = await profileRes.json();
            this.userProfile = {
              email: prof.email,
              name: prof.name,
              picture: prof.picture,
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem('google_user_profile', JSON.stringify(this.userProfile));
            }
          }
        } catch (err) {
          console.warn('Failed to fetch userinfo:', err);
        }

        resolve(accessToken);
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  public async getRecentEmails(maxResults = 5): Promise<GmailMessageSummary[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Usuario no autenticado en Gmail. Inicia sesión primero.');
    }

    // List recent messages
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!listRes.ok) {
      if (listRes.status === 401) {
        this.logout();
        throw new Error('Sesión de Gmail caducada. Por favor, vuelve a vincular tu cuenta.');
      }
      const errJson = await listRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Error al obtener mensajes de Gmail');
    }

    const listData = await listRes.json();
    const messages: GmailMessageSummary[] = [];

    if (listData.messages && Array.isArray(listData.messages)) {
      for (const item of listData.messages.slice(0, maxResults)) {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            const headers = msgData.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

            messages.push({
              id: msgData.id,
              threadId: msgData.threadId,
              snippet: msgData.snippet || '',
              subject: getHeader('Subject') || '(Sin Asunto)',
              from: getHeader('From') || '(Remitente Desconocido)',
              date: getHeader('Date') || '',
            });
          }
        } catch {
          // ignore single item errors
        }
      }
    }

    return messages;
  }
}

export const googleAuthManager = new GoogleAuthManager();
