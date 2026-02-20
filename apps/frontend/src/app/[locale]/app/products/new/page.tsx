"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useSiteStore } from "@/stores/siteStore";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Upload,
  X,
  DollarSign,
  Package,
  Truck,
  Search as SearchIcon,
  Check,
  Info,
  Save,
  Rocket,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const STEPS = ["basicInfo", "pricingInventory", "shippingSeo"] as const;

/* ── Stepper ────────────────────────────────────────────── */
function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            {/* connector line (before) */}
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 w-12 sm:w-20 transition-colors",
                  done ? "bg-primary" : "bg-(--color-border)"
                )}
              />
            )}
            {/* circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-(--color-muted) text-(--color-muted-foreground)"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  active ? "text-primary" : "text-(--color-muted-foreground)"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function NewProductPage() {
  const t = useTranslations("products");
  const router = useRouter();
  const { selectedSiteId } = useSiteStore();
  const [step, setStep] = useState(0);

  // Basic Info
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryInput, setGalleryInput] = useState("");

  // Pricing & Inventory
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [status, setStatus] = useState("draft");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");

  // Shipping & SEO
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [error, setError] = useState("");

  /* gallery helpers */
  const addGalleryImage = () => {
    const url = galleryInput.trim();
    if (url && !galleryUrls.includes(url)) {
      setGalleryUrls((prev) => [...prev, url]);
      setGalleryInput("");
    }
  };
  const removeGalleryImage = (idx: number) =>
    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));

  /* navigation */
  const canNext = () => {
    if (step === 0) return title.trim().length > 0;
    if (step === 1) return price.trim().length > 0;
    return true;
  };
  const next = () => {
    if (step < STEPS.length - 1 && canNext()) {
      setError("");
      setStep((s) => s + 1);
    }
  };
  const prev = () => step > 0 && setStep((s) => s - 1);

  /* submit */
  const createProduct = useMutation({
    mutationFn: async (asDraft: boolean) => {
      const payload: Record<string, unknown> = {
        name: title,
        description,
        short_description: shortDescription,
        regular_price: price,
        sale_price: salePrice || undefined,
        status: asDraft ? "draft" : status,
        sku: sku || undefined,
        categories: categories
          ? categories.split(",").map((c) => ({ name: c.trim() }))
          : undefined,
        tags: tags
          ? tags.split(",").map((tg) => ({ name: tg.trim() }))
          : undefined,
        manage_stock: !!stockQuantity,
        stock_status: stockQuantity ? "instock" : "instock",
        stock_quantity: stockQuantity ? Number(stockQuantity) : undefined,
        weight: weight || undefined,
        dimensions:
          length || width || height
            ? { length: length || "", width: width || "", height: height || "" }
            : undefined,
        images: imageUrl
          ? [
              { src: imageUrl },
              ...galleryUrls.map((u) => ({ src: u })),
            ]
          : galleryUrls.length > 0
          ? galleryUrls.map((u) => ({ src: u }))
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
    onSuccess: () => router.push("/app/products"),
    onError: (err: Error) => setError(err.message),
  });

  const handlePublish = () => {
    if (!title.trim() || !price.trim()) {
      setError(t("requiredFields"));
      return;
    }
    setError("");
    createProduct.mutate(false);
  };

  const handleDraft = () => {
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    setError("");
    createProduct.mutate(true);
  };

  /* shared classes */
  const textareaClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y";
  const selectClass = textareaClass + " h-10";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  const stepLabels = [t("stepBasicInfo"), t("stepPricing"), t("stepShipping")];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t("newProduct")}</h1>
      </div>

      {/* Stepper */}
      <Stepper current={step} labels={stepLabels} />

      {/* ── Step 1: Basic Info ── */}
      {step === 0 && (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left — Images */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <ImagePlus className="h-5 w-5 text-primary" /> {t("productImage")}
                </h3>

                {/* Main image drop zone */}
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-(--color-border) bg-muted/30 p-6 min-h-48 transition hover:border-primary/40">
                  {imageUrl ? (
                    <div className="relative w-full">
                      <img
                        src={imageUrl}
                        alt="Product"
                        className="mx-auto max-h-40 rounded-md object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-(--color-muted-foreground) mb-2" />
                      <p className="text-sm font-medium text-(--color-muted-foreground)">
                        {t("uploadMainImage")}
                      </p>
                      <p className="text-xs text-(--color-muted-foreground)">
                        PNG, JPG, WebP up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <Input
                  placeholder={t("imageUrlPlaceholder")}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />

                {/* Gallery */}
                <div>
                  <label className={cn(labelClass, "uppercase text-xs tracking-wide text-(--color-muted-foreground)")}>
                    {t("galleryImages")}
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder={t("imageUrlPlaceholder")}
                      value={galleryInput}
                      onChange={(e) => setGalleryInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addGalleryImage}>
                      +
                    </Button>
                  </div>
                  {galleryUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {galleryUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <div className="h-16 w-16 rounded-md border border-(--color-border) overflow-hidden bg-muted/30">
                            <img
                              src={url}
                              alt={`Gallery ${i + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "";
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(i)}
                            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Title / descriptions */}
              <div className="space-y-4">
                <Input
                  label={t("name")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                />
                <div>
                  <label className={labelClass}>
                    {t("shortDescription")}
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder={t("shortDescriptionPlaceholder")}
                    rows={2}
                    maxLength={150}
                    className={textareaClass}
                  />
                  <p className="text-xs text-(--color-muted-foreground) mt-1">
                    {shortDescription.length}/150
                  </p>
                </div>
                <div>
                  <label className={labelClass}>{t("description")}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("descriptionPlaceholder")}
                    rows={5}
                    className={textareaClass}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Pricing & Inventory ── */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left — Pricing */}
              <div className="space-y-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <DollarSign className="h-5 w-5 text-primary" /> {t("pricing")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
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
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={selectClass}
                  >
                    <option value="draft">{t("draft")}</option>
                    <option value="publish">{t("published")}</option>
                  </select>
                  <p className="text-xs text-(--color-muted-foreground) mt-1">
                    {t("statusHint")}
                  </p>
                </div>
              </div>

              {/* Right — Inventory */}
              <div className="space-y-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <Package className="h-5 w-5 text-primary" /> {t("inventory")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("sku")}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="PROD-123"
                  />
                  <Input
                    label={t("stockQuantity")}
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <Input
                  label={t("categories")}
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder={t("categoriesPlaceholder")}
                />
                <div>
                  <Input
                    label={t("tags")}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t("tagsPlaceholder")}
                  />
                  <p className="text-xs text-(--color-muted-foreground) mt-1">
                    {t("tagsHint")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Shipping & SEO ── */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left — Shipping */}
              <div className="space-y-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <Truck className="h-5 w-5 text-primary" /> {t("shippingDimensions")}
                </h3>
                <Input
                  label={t("weight")}
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label={t("length")}
                    type="number"
                    step="0.01"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label={t("width")}
                    type="number"
                    step="0.01"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label={t("height")}
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-primary">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("shippingHint")}</span>
                </div>
              </div>

              {/* Right — SEO */}
              <div className="space-y-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <SearchIcon className="h-5 w-5 text-primary" /> {t("seo")}
                </h3>
                <div>
                  <Input
                    label={t("metaTitle")}
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={t("metaTitlePlaceholder")}
                  />
                  <p className="text-xs text-(--color-muted-foreground) mt-1">
                    {t("metaTitleHint")}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>{t("metaDescription")}</label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={t("metaDescriptionPlaceholder")}
                    rows={4}
                    className={textareaClass}
                  />
                  <p className="text-xs text-(--color-muted-foreground) mt-1">
                    {t("metaDescHint")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={prev} type="button">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("previousStep")}
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canNext()} type="button">
            {t("nextStep")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDraft}
              loading={createProduct.isPending}
              type="button"
            >
              <Save className="mr-2 h-4 w-4" /> {t("saveAsDraft")}
            </Button>
            <Button
              onClick={handlePublish}
              loading={createProduct.isPending}
              type="button"
            >
              <Rocket className="mr-2 h-4 w-4" /> {t("publish")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
