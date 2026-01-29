import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { TeamsAuthProvider } from './teams-bot';

export class TeamsOAuthProvider implements TeamsAuthProvider {
  private msalClient: ConfidentialClientApplication;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    const clientId = process.env.MICROSOFT_APP_ID;
    const clientSecret = process.env.MICROSOFT_APP_PASSWORD;
    
    if (!clientId || !clientSecret) {
      console.warn('Microsoft Teams credentials not configured. Teams integration will be disabled.');
      // Create a minimal mock client to prevent errors
      this.msalClient = null as any;
      return;
    }

    const clientConfig = {
      auth: {
        clientId,
        clientSecret,
        authority: 'https://login.microsoftonline.com/common'
      }
    };

    this.msalClient = new ConfidentialClientApplication(clientConfig);
  }

  async getAccessToken(): Promise<string> {
    if (!this.msalClient) {
      throw new Error('Microsoft Teams integration not configured');
    }
    
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Use client credentials flow for application permissions
      const clientCredentialRequest = {
        scopes: [
          'https://graph.microsoft.com/.default'
        ],
        skipCache: false
      };

      const response = await this.msalClient.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (response?.accessToken) {
        this.accessToken = response.accessToken;
        // Set expiry 5 minutes before actual expiry for safety
        this.tokenExpiry = new Date(Date.now() + (response.expiresOn!.getTime() - Date.now()) - 300000);
        return this.accessToken;
      }

      throw new Error('Failed to acquire access token');
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Method for user-delegated permissions (when user explicitly grants consent)
  async getUserAccessToken(userId: string, scopes: string[] = []): Promise<string> {
    if (!this.msalClient) {
      throw new Error('Microsoft Teams integration not configured');
    }
    
    try {
      const account = await this.getAccountByUserId(userId);
      if (!account) {
        throw new Error('No account found for user');
      }
      
      const silentRequest = {
        scopes: scopes.length > 0 ? scopes : ['https://graph.microsoft.com/User.Read'],
        account
      };

      const response = await this.msalClient.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Error getting user access token:', error);
      throw error;
    }
  }

  private async getAccountByUserId(userId: string) {
    if (!this.msalClient) {
      return undefined;
    }
    const accounts = await this.msalClient.getTokenCache().getAllAccounts();
    return accounts.find(account => account.homeAccountId.includes(userId));
  }

  // Initialize OAuth flow for user consent
  async getAuthUrl(scopes: string[] = [], state?: string): Promise<string> {
    if (!this.msalClient) {
      throw new Error('Microsoft Teams integration not configured');
    }
    
    const authCodeUrlParameters = {
      scopes: scopes.length > 0 ? scopes : [
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/OnlineMeetings.Read.All',
        'https://graph.microsoft.com/Calls.AccessMedia.All'
      ],
      redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:5000/auth/callback',
      state: state || 'default_state'
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  // Handle OAuth callback
  async handleCallback(authCode: string, scopes: string[] = []): Promise<AuthenticationResult> {
    if (!this.msalClient) {
      throw new Error('Microsoft Teams integration not configured');
    }
    
    const tokenRequest = {
      code: authCode,
      scopes: scopes.length > 0 ? scopes : [
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/OnlineMeetings.Read.All', 
        'https://graph.microsoft.com/Calls.AccessMedia.All'
      ],
      redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:5000/auth/callback'
    };

    try {
      const response = await this.msalClient.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  // Validate and refresh token if needed
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // Simple validation - try to make a basic Graph API call
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}

export default TeamsOAuthProvider;