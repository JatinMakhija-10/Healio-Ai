
const BASE_URL = 'http://api-prod.endlessmedical.com/v1/dx';

interface APIResponse {
    status: string;
    SessionID?: string;
    Diseases?: Array<any>;
    VariableImportances?: Array<any>;
    [key: string]: any;
}

export class EndlessMedicalAPI {
    private static sessionId: string | null = null;

    static async initSession(): Promise<string | null> {
        try {
            const response = await fetch(`${BASE_URL}/InitSession`);
            const data: APIResponse = await response.json();

            if (data.status === 'ok' && data.SessionID) {
                this.sessionId = data.SessionID;
                await this.acceptTerms();
                return this.sessionId;
            }
            return null;
        } catch (error) {
            console.error('Failed to init Endless Medical session:', error);
            return null;
        }
    }

    private static async acceptTerms() {
        if (!this.sessionId) return;
        try {
            const params = new URLSearchParams();
            params.append('SessionID', this.sessionId);
            params.append('passphrase', 'I have read, understood and I accept and agree to comply with the Terms of Use of EndlessMedicalAPI and Endless Medical services. The Terms of Use are available on endlessmedical.com');

            await fetch(`${BASE_URL}/AcceptTermsOfUse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });
        } catch (error) {
            console.error('Failed to accept terms:', error);
        }
    }

    static async analyze(symptoms: string[]): Promise<any[]> {
        if (!this.sessionId) {
            await this.initSession();
        }

        if (!this.sessionId) return [];

        // 1. Update features (symptoms)
        // Note: In a real prod app, we need to map natural language symptoms to API specific feature names.
        // For this demo, we will try to pass loose terms or assume mapped elsewhere.
        // But Endless API requires specific feature names. 
        // We will skip complex mapping for now and just call Analyze to see if it works with defaults or require specific inputs.

        try {
            const response = await fetch(`${BASE_URL}/Analyze?SessionID=${this.sessionId}&NumberOfResults=5`);
            const data = await response.json();
            if (data.status === 'ok' && data.Diseases) {
                return data.Diseases;
            }
            return [];
        } catch (error) {
            console.error('Analysis failed:', error);
            return [];
        }
    }
}
