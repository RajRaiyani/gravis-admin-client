import axios from "./httpRequest";
import type {
  CreateFilterData,
  CreateFilterOptionData,
  UpdateFilterData,
  UpdateFilterOptionData,
} from "@/types/filter.type";

export const listFilters = (categoryId: string) => {
  return axios({
    method: "GET",
    url: "/filters",
    params: { category_id: categoryId },
  });
};

export const createFilter = (data: CreateFilterData) => {
  return axios({ method: "POST", url: "/filters", data });
};

export const createFilterOption = (data: CreateFilterOptionData) => {
  return axios({ method: "POST", url: "/filters/options", data });
};

export const updateFilter = (filterId: string, data: UpdateFilterData) => {
  return axios({
    method: "PUT",
    url: `/filters/${filterId}`,
    data,
  });
};

export const updateFilterOption = (
  filterOptionId: string,
  data: UpdateFilterOptionData
) => {
  return axios({
    method: "PUT",
    url: `/filters/options/${filterOptionId}`,
    data,
  });
};

export const deleteFilter = (filterId: string) => {
  return axios({ method: "DELETE", url: `/filters/${filterId}` });
};

export const deleteFilterOption = (filterOptionId: string) => {
  return axios({
    method: "DELETE",
    url: `/filters/options/${filterOptionId}`,
  });
};
