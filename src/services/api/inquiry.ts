import Http from "./httpRequest"


export function listInquiries(params?: {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return Http({
    url: "/inquiry",
    method: "GET",
    params,
  });
}



export function getInquiry(id: string) {
  return Http({
    url: `/inquiry/${id}`,
    method: "GET",
  });
}

export function updateInquiryStatus(id: string, status: string) {
  return Http({
    url: `/inquiry/${id}/status`,
    method: "PUT",
    data: { status },
  });
}

export function deleteInquiry(id: string) {
  return Http({
    url: `/inquiry/${id}`,
    method: "DELETE",
  });
}