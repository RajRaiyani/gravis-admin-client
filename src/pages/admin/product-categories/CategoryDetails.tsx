import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetProductCategory } from "@/hooks/useProductCategories";
import {
  useGetFilters,
  useCreateFilter,
  useCreateFilterOption,
  useUpdateFilter,
  useUpdateFilterOption,
  useDeleteFilter,
  useDeleteFilterOption,
} from "@/hooks/useFilters";
import type { ProductCategory } from "@/types/product-category.type";
import type { Filter, FilterOption } from "@/types/filter.type";

function getFiltersFromQuery(data: unknown): Filter[] {
  if (Array.isArray(data)) return data as Filter[];
  if (data && typeof data === "object" && "data" in data) {
    const d = (data as { data: unknown }).data;
    return Array.isArray(d) ? (d as Filter[]) : [];
  }
  return [];
}

function CategoryInfoCard({
  category,
  isLoading,
}: {
  category: ProductCategory | undefined;
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-sm">Loading category...</p>
        </CardContent>
      </Card>
    );
  }

  if (!category) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-sm">Category not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Category Info</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/product-categories/${category.id}/edit`)}
        >
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Title</p>
          <p className="font-medium">{category.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Description
          </p>
          <p className="text-sm">
            {category.description || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Image
          </p>
          {category.image?.url ? (
            <img
              src={category.image.url}
              alt={category.name}
              className="w-32 h-32 object-cover rounded-md border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Banner image
          </p>
          {category.banner_image?.url ? (
            <img
              src={category.banner_image.url}
              alt={`${category.name} banner`}
              className="w-full max-w-sm object-cover rounded-md border"
              style={{ aspectRatio: "5 / 2" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-full max-w-sm bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground"
              style={{ aspectRatio: "5 / 2" }}
            >
              No Banner
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterTreeCard({
  filters,
  isLoading,
  onAddFilter,
  onAddOption,
  onUpdateFilter,
  onUpdateOption,
  onDeleteFilter,
  onDeleteOption,
}: {
  filters: Filter[];
  isLoading: boolean;
  onAddFilter: (name: string, options?: string[]) => void;
  onAddOption: (filterId: string, value: string) => void;
  onUpdateFilter: (filterId: string, name: string) => void;
  onUpdateOption: (filterOptionId: string, value: string) => void;
  onDeleteFilter: (filterId: string) => void;
  onDeleteOption: (filterOptionId: string) => void;
}) {
  const [newFilterName, setNewFilterName] = useState("");
  const [showNewFilterInput, setShowNewFilterInput] = useState(false);
  const [addingOptionFilterId, setAddingOptionFilterId] = useState<
    string | null
  >(null);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [editFilterName, setEditFilterName] = useState("");
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionValue, setEditOptionValue] = useState("");

  const handleSaveNewFilter = useCallback(() => {
    const name = newFilterName.trim();
    if (!name) return;
    onAddFilter(name);
    setNewFilterName("");
    setShowNewFilterInput(false);
  }, [newFilterName, onAddFilter]);

  const handleSaveNewOption = useCallback(
    (filterId: string) => {
      const value = newOptionValue.trim();
      if (!value) return;
      onAddOption(filterId, value);
      setNewOptionValue("");
      setAddingOptionFilterId(null);
    },
    [newOptionValue, onAddOption]
  );

  const handleStartEditFilter = useCallback(
    (filter: Filter) => {
      setEditingFilterId(filter.id);
      setEditFilterName(filter.name);
    },
    []
  );

  const handleSaveEditFilter = useCallback(() => {
    if (!editingFilterId || !editFilterName.trim()) return;
    onUpdateFilter(editingFilterId, editFilterName.trim());
    setEditingFilterId(null);
    setEditFilterName("");
  }, [editingFilterId, editFilterName, onUpdateFilter]);

  const handleStartEditOption = useCallback(
    (opt: FilterOption) => {
      setEditingOptionId(opt.id);
      setEditOptionValue(opt.value);
    },
    []
  );

  const handleSaveEditOption = useCallback(() => {
    if (!editingOptionId || !editOptionValue.trim()) return;
    onUpdateOption(editingOptionId, editOptionValue.trim());
    setEditingOptionId(null);
    setEditOptionValue("");
  }, [editingOptionId, editOptionValue, onUpdateOption]);

  const handleDeleteFilter = useCallback(
    (filterId: string, filterName: string) => {
      if (window.confirm(`Delete filter "${filterName}" and all its options?`)) {
        onDeleteFilter(filterId);
      }
    },
    [onDeleteFilter]
  );

  const handleDeleteOption = useCallback(
    (filterOptionId: string, value: string) => {
      if (window.confirm(`Delete option "${value}"?`)) {
        onDeleteOption(filterOptionId);
      }
    },
    [onDeleteOption]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-sm">Loading filters...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter and Filter Option Tree</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3 list-none pl-0">
          {filters.map((filter) => (
            <li key={filter.id} className="border rounded-md p-3 bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                {editingFilterId === filter.id ? (
                  <>
                    <Input
                      value={editFilterName}
                      onChange={(e) => setEditFilterName(e.target.value)}
                      placeholder="Filter name"
                      className="max-w-[200px]"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveEditFilter}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingFilterId(null);
                        setEditFilterName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{filter.name}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit filter"
                      onClick={() => handleStartEditFilter(filter)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete filter"
                      className="text-destructive"
                      onClick={() =>
                        handleDeleteFilter(filter.id, filter.name)
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
              <ul className="mt-2 pl-4 space-y-1.5 list-none border-l-2 border-muted ml-1">
                {(filter.options ?? [])
                .filter((opt) => opt.value.trim() !== "")
                .map((opt) => (
                  <li
                    key={opt.id}
                    className="flex items-center gap-2 py-0.5"
                  >
                    {editingOptionId === opt.id ? (
                      <>
                        <Input
                          value={editOptionValue}
                          onChange={(e) => setEditOptionValue(e.target.value)}
                          placeholder="Option value"
                          className="max-w-[180px] h-8"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveEditOption}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingOptionId(null);
                            setEditOptionValue("");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">{opt.value}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit option"
                          onClick={() => handleStartEditOption(opt)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete option"
                          className="text-destructive"
                          onClick={() =>
                            handleDeleteOption(opt.id, opt.value)
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
                {addingOptionFilterId === filter.id ? (
                  <li className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      placeholder="New option value"
                      className="max-w-[180px] h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveNewOption(filter.id)}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingOptionFilterId(null);
                        setNewOptionValue("");
                      }}
                    >
                      Cancel
                    </Button>
                  </li>
                ) : (
                  <li>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setAddingOptionFilterId(filter.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add option
                    </Button>
                  </li>
                )}
              </ul>
            </li>
          ))}
        </ul>
        {showNewFilterInput ? (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <Input
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Filter name"
              className="max-w-[220px]"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveNewFilter}>
              Add filter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewFilterInput(false);
                setNewFilterName("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowNewFilterInput(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function CategoryDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categoryId = id ?? "";

  const { data: categoryData, isLoading: isLoadingCategory } =
    useGetProductCategory(categoryId);
  const { data: filtersData, isLoading: isLoadingFilters } =
    useGetFilters(categoryId);

  const category = categoryData
    ? (categoryData as unknown as { data?: ProductCategory })?.data ||
      (categoryData as unknown as ProductCategory | undefined)
    : undefined;

  const filters = getFiltersFromQuery(filtersData ?? null);

  const createFilter = useCreateFilter(categoryId);
  const createFilterOption = useCreateFilterOption(categoryId);
  const updateFilterMutation = useUpdateFilter(categoryId);
  const updateFilterOptionMutation = useUpdateFilterOption(categoryId);
  const deleteFilterMutation = useDeleteFilter(categoryId);
  const deleteFilterOptionMutation = useDeleteFilterOption(categoryId);

  const handleAddFilter = useCallback(
    (name: string, options?: string[]) => {
      createFilter.mutate(
        { category_id: categoryId, name, options: options ?? [] },
        { onError: () => {} }
      );
    },
    [categoryId, createFilter]
  );

  const handleAddOption = useCallback(
    (filterId: string, value: string) => {
      createFilterOption.mutate(
        { filter_id: filterId, value },
        { onError: () => {} }
      );
    },
    [createFilterOption]
  );

  const handleUpdateFilter = useCallback(
    (filterId: string, name: string) => {
      updateFilterMutation.mutate(
        { filterId, data: { name } },
        { onError: () => {} }
      );
    },
    [updateFilterMutation]
  );

  const handleUpdateOption = useCallback(
    (filterOptionId: string, value: string) => {
      updateFilterOptionMutation.mutate(
        { filterOptionId, data: { value } },
        { onError: () => {} }
      );
    },
    [updateFilterOptionMutation]
  );

  const handleDeleteFilter = useCallback(
    (filterId: string) => {
      deleteFilterMutation.mutate(filterId, { onError: () => {} });
    },
    [deleteFilterMutation]
  );

  const handleDeleteOption = useCallback(
    (filterOptionId: string) => {
      deleteFilterOptionMutation.mutate(filterOptionId, { onError: () => {} });
    },
    [deleteFilterOptionMutation]
  );

  if (!categoryId) {
    navigate("/product-categories");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Category Details</h1>
        <Button variant="outline" onClick={() => navigate("/product-categories")}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <CategoryInfoCard category={category} isLoading={isLoadingCategory} />
        </div>
        <div className="space-y-4">
          <FilterTreeCard
            filters={filters}
            isLoading={isLoadingFilters}
            onAddFilter={handleAddFilter}
            onAddOption={handleAddOption}
            onUpdateFilter={handleUpdateFilter}
            onUpdateOption={handleUpdateOption}
            onDeleteFilter={handleDeleteFilter}
            onDeleteOption={handleDeleteOption}
          />
        </div>
      </div>
    </div>
  );
}
