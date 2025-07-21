// TypeScript client wrapper for Claude Session Service using ConnectRPC
// This is a manual implementation until proper code generation is set up

export interface ClaudeSession {
  id: string;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ClaudeMessage[];
  user_id: number;
  metadata?: Record<string, any>;
}

export interface ClaudeMessage {
  type: string;
  subtype?: string;
  message?: any;
  session_id?: string;
  parent_tool_use_id?: string;
  result?: string;
  is_error?: boolean;
  timestamp?: string;
}

export interface GetSessionsRequest {
  // No fields needed - authentication handled by middleware
}

export interface GetSessionsResponse {
  sessions: ClaudeSession[];
}

export interface GetSessionRequest {
  session_id: string;
}

export interface GetSessionResponse {
  session: ClaudeSession;
}

export interface DeleteSessionRequest {
  session_id: string;
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

export interface UpdateSessionRequest {
  session_id: string;
  title?: string;
  metadata?: Record<string, string>;
}

export interface UpdateSessionResponse {
  session: ClaudeSession;
}

export interface CheckAuthRequest {
  // No fields needed - authentication handled by middleware
}

export interface CheckAuthResponse {
  authenticated: boolean;
  user_id?: string;
  redirect_url?: string;
}

// Client interface that mimics ConnectRPC client
export interface ClaudeSessionServiceClient {
  getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse>;
  getSession(request: GetSessionRequest): Promise<GetSessionResponse>;
  deleteSession(request: DeleteSessionRequest): Promise<DeleteSessionResponse>;
  updateSession(request: UpdateSessionRequest): Promise<UpdateSessionResponse>;
  checkAuth(request: CheckAuthRequest): Promise<CheckAuthResponse>;
}

// Implementation using fetch API (to be replaced with actual ConnectRPC client)
export class FetchClaudeSessionClient implements ClaudeSessionServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || window.location.origin;
  }

  private async makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/flow/claude${path}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse> {
    const sessions = await this.makeRequest<ClaudeSession[]>('/sessions');
    return { sessions: Array.isArray(sessions) ? sessions : [] };
  }

  async getSession(request: GetSessionRequest): Promise<GetSessionResponse> {
    const session = await this.makeRequest<ClaudeSession>(`/sessions/${request.session_id}`);
    return { session };
  }

  async deleteSession(request: DeleteSessionRequest): Promise<DeleteSessionResponse> {
    await this.makeRequest(`/sessions/${request.session_id}`, {
      method: 'DELETE',
    });
    return { success: true, message: 'Session deleted successfully' };
  }

  async updateSession(request: UpdateSessionRequest): Promise<UpdateSessionResponse> {
    const body: any = {};
    if (request.title) body.title = request.title;
    if (request.metadata) body.metadata = request.metadata;

    const session = await this.makeRequest<ClaudeSession>(`/sessions/${request.session_id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return { session };
  }

  async checkAuth(request: CheckAuthRequest): Promise<CheckAuthResponse> {
        return { authenticated: true };
  }
}

// Factory function to create client
export function createClaudeSessionClient(baseUrl?: string): ClaudeSessionServiceClient {
  return new FetchClaudeSessionClient(baseUrl);
}