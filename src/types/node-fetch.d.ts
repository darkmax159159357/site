declare module 'node-fetch' {
  export default function fetch(
    url: string | URL,
    init?: RequestInit
  ): Promise<Response>;
  
  export class Request extends globalThis.Request {
    constructor(input: RequestInfo, init?: RequestInit);
  }
  
  export class Response extends globalThis.Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
  }
  
  export class Headers extends globalThis.Headers {
    constructor(init?: HeadersInit);
  }
  
  export type RequestInfo = string | URL | Request;
  export type RequestInit = {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    redirect?: RequestRedirect;
    signal?: AbortSignal | null;
    agent?: any;
    compress?: boolean;
    follow?: number;
    size?: number;
    timeout?: number;
  };
  
  export type RequestRedirect = 'follow' | 'error' | 'manual';
  export type HeadersInit = Headers | Record<string, string> | [string, string][];
  export type BodyInit = ReadableStream | string | Blob | ArrayBuffer | 
    ArrayBufferView | FormData | URLSearchParams | null;
} 