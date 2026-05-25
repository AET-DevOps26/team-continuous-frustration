export type EntityId = string;

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface ApiError {
    message: string;
    statusCode?: number;
}

export interface PageResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalItems: number;
}
