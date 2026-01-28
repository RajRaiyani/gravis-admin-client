import { Link } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetProductCategories,
  useDeleteProductCategory,
} from "@/hooks/useProductCategories";
import type { ProductCategory } from "@/types/product-category.type";
import { useState } from "react";

export default function ProductCategories() {
  const { data, isLoading, error } = useGetProductCategories();
  const { mutate: deleteCategory, isPending: isDeleting } =
    useDeleteProductCategory();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      setDeletingId(id);
      deleteCategory(id, {
        onSettled: () => setDeletingId(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load product categories</p>
      </div>
    );
  }

  // Handle both response formats: { data: [...] } or [...]
  const categories = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Categories</h1>
        <Link to="/product-categories/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No product categories found</p>
            <Link to="/product-categories/create">
              <Button variant="outline" className="mt-4">
                Create your first category
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: ProductCategory) => (
            <Card
              key={category.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <div className="flex gap-2">
                    <Link to={`/product-categories/${category.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      disabled={isDeleting && deletingId === category.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
                {category.image?.url && (
                  <div className="mt-4 w-full flex justify-center">
                    <img
                      src={category.image.url}
                      alt={category.name}
                      className="size-56 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
