import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { productFormSchema, type ProductFormValues } from "@/schema/product";
import {
  useGetProduct,
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { useGetProductCategories } from "@/hooks/useProductCategories";
import { useGetFilters } from "@/hooks/useFilters";
import { ImageCropInput } from "@/components/shared/ImageCropInput";
import { uploadFile } from "@/services/api/file";
import { toast } from "react-hot-toast";
import type { Product } from "@/types/product.type";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddOrUpdateProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: productData, isLoading: isLoadingProduct } = useGetProduct(
    id || ""
  );
  const { data: categoriesData } = useGetProductCategories();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  // Extract product from response
  const product = productData
    ? (productData as unknown as { data?: Product })?.data ||
      (productData as unknown as Product | undefined)
    : undefined;

  const existingImageId = useMemo(() => {
    return product?.images?.find((img) => img.is_primary)?.image?.id || "";
  }, [product]);

  // Extract categories from response
  const categories = categoriesData
    ? Array.isArray((categoriesData as any)?.data)
      ? (categoriesData as any).data
      : Array.isArray(categoriesData)
      ? categoriesData
      : []
    : [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      category_id: "",
      name: "",
      description: "",
      tags: [],
      points: [],
      technical_details: [],
      metadata: {},
      sale_price: 0,
      product_label: "",
      warranty_label: "",
      is_featured: false,
      imageFile: null,
      attribute_mappings: [],
    },
  });

  const watchedCategoryId = useWatch({
    control: form.control,
    name: "category_id",
    defaultValue: "",
  });
  const watchedAttributeMappings = useWatch({
    control: form.control,
    name: "attribute_mappings",
    defaultValue: [],
  });
  const categoryId =
    String(watchedCategoryId || "") ||
    (isEditing ? product?.category_id : "") ||
    "";
  const { data: filtersData } = useGetFilters(categoryId);
  const filters = Array.isArray(filtersData) ? filtersData : [];

  const tagsFieldArray = useFieldArray({
    control: form.control,
    name: "tags",
  });

  const pointsFieldArray = useFieldArray({
    control: form.control,
    name: "points",
  });

  const technicalDetailsFieldArray = useFieldArray({
    control: form.control,
    name: "technical_details",
  });

  const attributeMappingsFieldArray = useFieldArray({
    control: form.control,
    name: "attribute_mappings",
  });

  // Load product data when editing
  useEffect(() => {
    if (product && isEditing) {
      // Ensure tags is always an array
      const tags = Array.isArray(product.tags)
        ? product.tags.filter(
            (tag) => tag && typeof tag === "string" && tag.trim().length > 0
          )
        : [];

      // Ensure points is always an array
      const points = Array.isArray(product.points)
        ? product.points.filter(
            (point) =>
              point && typeof point === "string" && point.trim().length > 0
          )
        : [];

      // Ensure technical_details is always an array
      const technicalDetails = Array.isArray(product.technical_details)
        ? product.technical_details
            .filter(
              (detail: any) =>
                detail &&
                typeof detail === "object" &&
                detail.label &&
                detail.value
            )
            .map((detail: any) => ({
              label: String(detail.label),
              value: String(detail.value),
            }))
        : [];

      const attributeMappings = Array.isArray(product.filter_options)
        ? product.filter_options
            .filter(
              (fo: { filter_option_id?: string; filter_id?: string }) =>
                fo?.filter_option_id && fo?.filter_id
            )
            .map((fo: { filter_option_id: string; filter_id: string }) => ({
              filter_id: fo.filter_id,
              filter_option_id: fo.filter_option_id,
            }))
        : [];

      form.reset({
        category_id: product.category_id || "",
        name: product.name || "",
        description: product.description || "",
        tags: tags.map((t) => ({ value: t })),
        points: points.map((p) => ({ value: p })),
        technical_details: technicalDetails,
        metadata: product.metadata || {},
        sale_price: product.sale_price_in_rupee,
        product_label: product.product_label || "",
        warranty_label: product.warranty_label || "",
        is_featured: product.is_featured || false,
        imageFile: null,
        attribute_mappings: attributeMappings,
      });
    }
  }, [product, isEditing, form]);

  const onSubmit = async (data: ProductFormValues) => {
    const imageFile = data.imageFile ?? null;

    if (!imageFile && !existingImageId) {
      form.setError("imageFile", {
        type: "manual",
        message: "Product image is required",
      });
      return;
    }

    let imageId = existingImageId;

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        const response = await uploadFile(formData);
        imageId = (response as { id?: string })?.id ?? "";
        if (!imageId) {
          toast.error("Failed to upload image");
          return;
        }
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: string }).message)
            : "Failed to upload image";
        toast.error(message);
        return;
      }
    }

    // Map field array values to API shape (string[] for tags/points)
    const filteredTags = (data.tags || [])
      .map((t) => t.value?.trim())
      .filter((v) => v && v.length > 0);
    const filteredPoints = (data.points || [])
      .map((p) => p.value?.trim())
      .filter((v) => v && v.length > 0);

    const filterOptionIds = (data.attribute_mappings || [])
      .map((m) => m.filter_option_id)
      .filter(Boolean);

    const submitData = {
      category_id: data.category_id,
      name: data.name,
      description: data.description || "",
      tags: filteredTags,
      points: filteredPoints,
      technical_details: data.technical_details || [],
      metadata: data.metadata || {},
      sale_price: data.sale_price,
      image_id: imageId,
      product_label: data.product_label || undefined,
      warranty_label: data.warranty_label || undefined,
      is_featured: data.is_featured || false,
      filter_option_ids: filterOptionIds,
    };

    if (isEditing && id) {
      updateProduct(
        { id, data: submitData },
        {
          onSuccess: () => {
            navigate("/products");
          },
        }
      );
    } else {
      createProduct(
        { ...submitData },
        {
          onSuccess: () => {
            navigate("/products");
          },
        }
      );
    }
  };

  const primaryImgUrl = useMemo(() => {
    return product?.images?.find((img) => img.is_primary)?.image?.url;
  }, [product]);

  if (isLoadingProduct && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  const isPending = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
        <Button variant="outline" onClick={() => navigate("/products")}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="imageFile"
                render={() => (
                  <FormItem>
                    <FormLabel>Product Image *</FormLabel>
                    <FormControl>
                      <FormField
                        control={form.control}
                        name="imageFile"
                        render={({ field: fileField }) => (
                          <ImageCropInput
                            value={fileField.value ?? null}
                            onChange={fileField.onChange}
                            onBlur={fileField.onBlur}
                            disabled={isPending}
                            aspect={1}
                            cropShape="rect"
                            existingPreviewUrl={primaryImgUrl ?? null}
                            aria-label="Product image"
                          />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description"
                        rows={4}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (in ₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter price in rupees (e.g., 100.00)"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      {field.value
                        ? `₹${(field.value as number).toFixed(2)}`
                        : ""}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Label (Optional)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="">None</option>
                        <option value="New">New</option>
                        <option value="Best Seller">Best Seller</option>
                        <option value="Hot Deal">Hot Deal</option>
                        <option value="Limited Edition">Limited Edition</option>
                        <option value="Top Rated">Top Rated</option>
                        <option value="Sale">Sale</option>
                        <option value="Exclusive">Exclusive</option>
                      </select>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Badge to display on product card
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warranty_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (Optional)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      >
                        <option value="">No Warranty</option>
                        <option value="3 Months Warranty">3 Months Warranty</option>
                        <option value="6 Months Warranty">6 Months Warranty</option>
                        <option value="9 Months Warranty">9 Months Warranty</option>
                        <option value="1 Year Warranty">1 Year Warranty</option>
                        <option value="1.5 Years Warranty">1.5 Years Warranty</option>
                        <option value="2 Years Warranty">2 Years Warranty</option>
                        <option value="3 Years Warranty">3 Years Warranty</option>
                        <option value="5 Years Warranty">5 Years Warranty</option>
                        <option value="Lifetime Warranty">Lifetime Warranty</option>
                      </select>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Warranty period for this product
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-4 rounded-lg border border-input p-4 bg-muted/30">
                      <FormControl>
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                        />
                      </FormControl>
                      <label htmlFor="is_featured" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">⭐</span>
                          <span className="font-semibold text-base">
                            Mark as Featured Product
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Featured products are highlighted on homepage and get
                          priority in search results
                        </p>
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Section */}
              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>

                <div className="space-y-2">
                  {tagsFieldArray.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`tags.${index}.value`}
                        render={({ field: inputField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Enter tag"
                                {...inputField}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => tagsFieldArray.remove(index)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => tagsFieldArray.append({ value: "" })}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </div>

              {/* Points Section */}
              <div className="space-y-2">
                <FormLabel>Points</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Add key points about the product (max 70 characters per point)
                </p>
                <div className="space-y-2">
                  {pointsFieldArray.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`points.${index}.value`}
                        render={({ field: inputField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Enter point (max 70 characters)"
                                {...inputField}
                                maxLength={70}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => pointsFieldArray.remove(index)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => pointsFieldArray.append({ value: "" })}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Point
                </Button>
              </div>

              {/* Technical Details Section */}
              <div className="space-y-2">
                <FormLabel>Technical Details</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Add technical specifications like weight, dimensions,
                  materials, etc.
                </p>
                <div className="space-y-2">
                  {technicalDetailsFieldArray.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`technical_details.${index}.label`}
                        render={({ field: labelField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Label (e.g., Weight, Dimensions)"
                                {...labelField}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`technical_details.${index}.value`}
                        render={({ field: valueField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Value (e.g., 2.5 kg, 10x5x3 cm)"
                                {...valueField}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => technicalDetailsFieldArray.remove(index)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    technicalDetailsFieldArray.append({
                      label: "",
                      value: "",
                    })
                  }
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Technical Detail
                </Button>
              </div>

              {/* Attribute mapping (filter options by category) */}
              <div className="space-y-2">
                <FormLabel>Attribute mapping</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Map product to category filters. Select a category first, then
                  add filter + option pairs. These appear as attributes on the
                  product.
                </p>
                {!categoryId ? (
                  <p className="text-sm text-muted-foreground italic">
                    Select a category to load filters and options.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {((watchedAttributeMappings as { filter_id?: string; filter_option_id?: string }[]) || []).map(
                        (row, index) => {
                        const selectedFilterId = row?.filter_id || "";
                        const selectedFilter = filters.find(
                          (f) => f.id === selectedFilterId
                        );
                        const options = selectedFilter?.options ?? [];
                        const field = attributeMappingsFieldArray.fields[index];
                        if (!field) return null;
                        return (
                          <div
                            key={field.id}
                            className="flex gap-2 items-center flex-wrap"
                          >
                            <FormField
                              control={form.control}
                              name={`attribute_mappings.${index}.filter_id`}
                              render={({ field: selectField }) => (
                                <FormItem className="min-w-[160px]">
                                  <FormControl>
                                    <select
                                      {...selectField}
                                      onChange={(e) => {
                                        selectField.onChange(e.target.value);
                                        form.setValue(
                                          `attribute_mappings.${index}.filter_option_id`,
                                          ""
                                        );
                                      }}
                                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      disabled={isPending}
                                    >
                                      <option value="">
                                        Select filter
                                      </option>
                                      {filters.map((f) => (
                                        <option key={f.id} value={f.id}>
                                          {f.name}
                                        </option>
                                      ))}
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`attribute_mappings.${index}.filter_option_id`}
                              render={({ field: optionField }) => (
                                <FormItem className="min-w-[160px]">
                                  <FormControl>
                                    <select
                                      {...optionField}
                                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                      disabled={isPending || !selectedFilterId}
                                    >
                                      <option value="">
                                        Select option
                                      </option>
                                      {options.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                          {opt.value}
                                        </option>
                                      ))}
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                attributeMappingsFieldArray.remove(index)
                              }
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        attributeMappingsFieldArray.append({
                          filter_id: "",
                          filter_option_id: "",
                        })
                      }
                      disabled={isPending || filters.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add attribute
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                    ? "Update Product"
                    : "Create Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
