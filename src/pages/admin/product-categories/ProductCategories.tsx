import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetProductCategories,
  useDeleteProductCategory,
} from "@/hooks/useProductCategories";
import type { ProductCategory } from "@/types/product-category.type";
import { useState } from "react";

export default function ProductCategories() {
  const navigate = useNavigate();
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
  const categories =
    data && Array.isArray(data.data)
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Category Image</TableHead>
                  <TableHead className="w-[250px]">Banner Image</TableHead>
                  <TableHead>Category Info</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: ProductCategory) => (
                  <TableRow
                    key={category.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/product-categories/${category.id}`)}
                  >
                    <TableCell>
                      {category.image?.url ? (
                        <img
                          src={category.image.url}
                          alt={category.name}
                          className="w-32 h-32 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.banner_image?.url ? (
                        <img
                          src={category.banner_image.url}
                          alt={`${category.name} banner`}
                          className="w-60 h-24 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-48 h-24 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                          No Banner
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-base">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2 justify-end">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
