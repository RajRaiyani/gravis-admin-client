import Http from "./httpRequest";

export function getDashboardStats() {
  return Http({
    url: "/dashboard/stats",
    method: "GET",
  });
}
