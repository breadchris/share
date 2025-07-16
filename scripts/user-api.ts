export interface GetUserRequest {
    id: string;
}

export interface GetUserResponse {
    user: models.User;
}

export interface ListGroupsRequest {
    user_id: string;
}

export interface ListGroupsResponse {
    groups: models.Group[];
}

export interface CreateGroupRequest {
    name: string;
    user_id: string;
}

export interface CreateGroupResponse {
    group: models.Group;
}

export interface JoinGroupRequest {
    join_code: string;
    user_id: string;
}

export interface JoinGroupResponse {
    group: models.Group;
    membership: models.GroupMembership;
}

export interface DeleteGroupRequest {
    group_id: string;
    user_id: string;
}

export interface DeleteGroupResponse {
    success: boolean;
    message: string;
}

export interface RemoveMemberRequest {
    membership_id: string;
    user_id: string;
}

export interface RemoveMemberResponse {
    success: boolean;
    message: string;
}

export interface FetchOptions {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface Response<T> {
    data: T;
    status: number;
    statusText: string;
}

export async function GetUser(req: GetUserRequest, options: FetchOptions = {}): Promise<Response<GetUserResponse>> {
    const url = `${options.baseURL || ''}/getuser`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

export async function ListGroups(req: ListGroupsRequest, options: FetchOptions = {}): Promise<Response<ListGroupsResponse>> {
    const url = `${options.baseURL || ''}/listgroups`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

export async function CreateGroup(req: CreateGroupRequest, options: FetchOptions = {}): Promise<Response<CreateGroupResponse>> {
    const url = `${options.baseURL || ''}/creategroup`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

export async function JoinGroup(req: JoinGroupRequest, options: FetchOptions = {}): Promise<Response<JoinGroupResponse>> {
    const url = `${options.baseURL || ''}/joingroup`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

export async function DeleteGroup(req: DeleteGroupRequest, options: FetchOptions = {}): Promise<Response<DeleteGroupResponse>> {
    const url = `${options.baseURL || ''}/deletegroup`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

export async function RemoveMember(req: RemoveMemberRequest, options: FetchOptions = {}): Promise<Response<RemoveMemberResponse>> {
    const url = `${options.baseURL || ''}/removemember`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

