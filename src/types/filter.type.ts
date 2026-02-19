export interface FilterOption {
  id: string;
  filter_id: string;
  value: string;
}

export interface Filter {
  id: string;
  category_id: string;
  name: string;
  options?: FilterOption[];
}

export interface CreateFilterData {
  category_id: string;
  name: string;
  options?: string[];
}

export interface CreateFilterOptionData {
  filter_id: string;
  value: string;
}

export interface UpdateFilterData {
  name: string;
}

export interface UpdateFilterOptionData {
  value: string;
}
