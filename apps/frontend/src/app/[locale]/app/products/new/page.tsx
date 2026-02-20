"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useSiteStore } from "@/stores/siteStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ImagePlus, Package, Tag, Search as SearchIcon, BarChart3 } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function NewProductPage() {
  const t = useTranslations("products");
  const router = useRouter();
  const { selectedSiteId } = useSiteStore();

  // General
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [status, setStatus] = useState("draft");

  // Organization
  const [sku, setSku] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");

  // Inventory
  const [stockStatus, setStockStatus] = useState("instock");
  const [stockQuantity, setStockQuantity] = useState("");
  const [manageStock, setManageStock] = useState(false);

  // Shipping
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Images
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState("");

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [error, setError] = useState("");

  const createProduct = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: title,
        description,
        short_description: shortDescription,
        regular_price: price,
        sale_price: salePrice || undefined,
        status,
        sku: sku || undefined,
        categories: categories
          ? categories.split(",").map((c) => ({ name: c.trim() }))
          : undefined,
        tags: tags
          ? tags.split(",").map((t) => ({ name: t.trim() }))
          : undefined,
        manage_stock: manageStock,
        stock_status: stockStatus,
        stock_quantity: manageStock && stockQuantity ? Number(stockQuantity) : undefined,
        weight: weight || undefined,
        dimensions:
          length || width || height
            ? { length: length || "", width: width || "", height: height || "" }
            : undefined,
        images: imageUrl
          ? [
              { src: imageUrl },
              ...(galleryUrls
                ? galleryUrls.split(",").map((u) => ({ src: u.trim() }))
                : []),
            ]
          : undefined,
        meta_data:
          metaTitle || metaDescription
            ? [
                ...(metaTitle ? [{ key: "_yoast_wpseo_title", value: metaTitle }] : []),
                ...(metaDescription
                  ? [{ key: "_yoast_wpseo_metadesc", value: metaDescription }]
                  : []),
              ]
            : undefined,
        siteId: selectedSiteId || undefined,
      };
      const res = await api("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      router.push("/app/products");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) {
      setError(t("requiredFields"));
      return;
    }
    setError("");
    createProduct.mutate();
  };

  const sectionClass =
    "grid gap-4 sm:grid-cols-2";
  const textareaClass =
    "w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)";
  const selectClass = textareaClass;
  const labelClass = "block text-sm font-medium text-(--color-foreground) mb-1";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("newProduct")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> {t("general")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("name")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
            <div>
              <label className={labelClass}>{t("description")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={4}
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t("shortDescription")}</label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder={t("shortDescriptionPlaceholder")}
                rows={2}
                className={textareaClass}
              />
            </div>
            <div className={sectionClass}>
              <Input
                label={t("price")}
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
              <Input
                label={t("salePrice")}
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>{t("status")}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                <option value="draft">{t("draft")}</option>
                <option value="publish">{t("published")}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="h-5 w-5" /> {t("images")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("productImage")}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <div>
              <label className={labelClass}>{t("galleryImages")}</label>
              <textarea
                value={galleryUrls}
                onChange={(e) => setGalleryUrls(e.target.value)}
                placeholder={t("galleryPlaceholder")}
                rows={2}
                className={textareaClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5" /> {t("organization")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("sku")}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU-001"
            />
            <Input
              label={t("categories")}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder={t("categoriesPlaceholder")}
            />
            <Input
              label={t("tags")}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("tagsPlaceholder")}
            />
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" /> {t("inventory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelClass}>{t("stockStatus")}</label>
              <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className={selectClass}>
                <option value="instock">{t("inStock")}</option>
                <option value="outofstock">{t("outOfStock")}</option>
                <option value="onbackorder">{t("onBackorder")}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="manageStock"
                checked={manageStock}
                onChange={(e) => setManageStock(e.target.checked)}
                className="h-4 w-4 rounded border-(--color-border)"
              />
              <label htmlFor="manageStock" className="text-sm text-(--color-foreground)">
                {t("manageStock")}
              </label>
            </div>
            {manageStock && (
              <Input
                label={t("stockQuantity")}
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
              />
            )}
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("shipping")}</CardTitle>
          </CardHeader>
          <CardContent className={sectionClass}>
            <Input
              label={t("weight")}
              type="number"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="kg"
            />
            <Input
              label={t("length")}
              type="number"
              step="0.01"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="cm"
            />
            <Input
              label={t("width")}
              type="number"
              step="0.01"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="cm"
            />
            <Input
              label={t("height")}
              type="number"
              step="0.01"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="cm"
            />
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <SearchIcon className="h-5 w-5" /> {t("seo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("metaTitle")}
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={t("metaTitlePlaceholder")}
            />
            <div>
              <label className={labelClass}>{t("metaDescription")}</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={t("metaDescriptionPlaceholder")}
                rows={3}
                className={textareaClass}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-(--color-destructive)">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={createProduct.isPending}>
            {t("create")}
          </Button>
          <Link href="/app/products">
            <Button variant="outline">{t("cancel")}</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
