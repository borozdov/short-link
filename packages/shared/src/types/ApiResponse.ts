export type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };
