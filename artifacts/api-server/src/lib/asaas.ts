const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

export function isAsaasConfigured(): boolean {
  return !!ASAAS_API_KEY;
}

interface AsaasErrorResponse {
  errors?: Array<{ code: string; description: string }>;
}

async function asaasRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: object,
): Promise<T> {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY não configurado");
  }

  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as T & AsaasErrorResponse;

  if (!res.ok) {
    const msg =
      (data as AsaasErrorResponse).errors?.[0]?.description ?? `Asaas API error (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
}

interface CustomerListResponse {
  data: AsaasCustomer[];
  totalCount: number;
}

export async function findOrCreateCustomer(
  email: string,
  name?: string,
  cpfCnpj?: string,
): Promise<AsaasCustomer> {
  const list = await asaasRequest<CustomerListResponse>(
    "GET",
    `/customers?email=${encodeURIComponent(email)}&limit=1`,
  );
  if (list.data && list.data.length > 0) {
    return list.data[0]!;
  }
  const payload: Record<string, string> = {
    name: name || email.split("@")[0]!,
    email,
  };
  if (cpfCnpj) payload.cpfCnpj = cpfCnpj;
  return asaasRequest<AsaasCustomer>("POST", "/customers", payload);
}

export interface AsaasSubscription {
  id: string;
  status: string;
  value: number;
  cycle: string;
  nextDueDate: string;
  externalReference?: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  invoiceUrl: string;
  dueDate: string;
  confirmedDate?: string;
  externalReference?: string;
}

interface PaymentListResponse {
  data: AsaasPayment[];
  totalCount: number;
}

export async function createSubscription(params: {
  customerId: string;
  value: number;
  cycle: "MONTHLY" | "YEARLY";
  description: string;
  externalReference: string;
  nextDueDate: string;
}): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>("POST", "/subscriptions", {
    customer: params.customerId,
    billingType: "UNDEFINED",
    value: params.value,
    nextDueDate: params.nextDueDate,
    cycle: params.cycle,
    description: params.description,
    externalReference: params.externalReference,
  });
}

export async function getSubscriptionPayments(
  subscriptionId: string,
): Promise<PaymentListResponse> {
  return asaasRequest<PaymentListResponse>(
    "GET",
    `/subscriptions/${subscriptionId}/payments?limit=1&offset=0`,
  );
}
