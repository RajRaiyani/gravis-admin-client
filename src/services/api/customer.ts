import Http from "./httpRequest";

export function listCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return Http({
    url: "/customers",
    method: "GET",
    params,
  });
}

export function getCustomer(id: string) {
  return Http({
    url: `/customers/${id}`,
    method: "GET",
  });
}