import { useMemo, useState, type FormEvent } from 'react';
import { useConvexMutation } from '@convex-dev/react-query';
import { Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Product } from '~/lib/data';
import { convexApi } from '~/lib/convex';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';

type ProductFormValues = {
  name: string;
  sku: string;
  pricePerKg: string;
  packageWeightKg: string;
  currentStockBoxes: string;
  threshold: string;
};

type ProductField = keyof ProductFormValues;
type ProductErrors = Partial<Record<ProductField | 'form', string>>;

const valuesFromProduct = (product: Product): ProductFormValues => ({
  name: product.name,
  sku: product.sku,
  pricePerKg: String(product.price_per_kg),
  packageWeightKg: String(product.package_weight_kg),
  currentStockBoxes: String(product.current_stock_boxes),
  threshold: String(product.threshold),
});

export function ProductEditDialog({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ProductFormValues>(() =>
    valuesFromProduct(product),
  );
  const [errors, setErrors] = useState<ProductErrors>({});
  const [isPending, setIsPending] = useState(false);
  const updateProduct = useConvexMutation(convexApi.products.update);

  const stockKg = useMemo(() => {
    const boxes = Number(values.currentStockBoxes);
    const packageWeight = Number(values.packageWeightKg);
    if (
      !Number.isFinite(boxes) ||
      !Number.isFinite(packageWeight) ||
      boxes < 0 ||
      packageWeight <= 0
    ) {
      return 0;
    }
    return boxes * packageWeight;
  }, [values.currentStockBoxes, values.packageWeightKg]);

  const updateValue = (field: ProductField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field] && !current.form) return current;
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;
    setOpen(nextOpen);
    if (nextOpen) {
      setValues(valuesFromProduct(product));
      setErrors({});
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: ProductErrors = {};
    const pricePerKg = Number(values.pricePerKg);
    const packageWeightKg = Number(values.packageWeightKg);
    const currentStockBoxes = Number(values.currentStockBoxes);
    const threshold = Number(values.threshold);

    if (!values.name.trim()) nextErrors.name = 'Product name is required.';
    if (!values.sku.trim()) nextErrors.sku = 'SKU is required.';
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      nextErrors.pricePerKg = 'Enter a price greater than 0.';
    }
    if (!Number.isFinite(packageWeightKg) || packageWeightKg <= 0) {
      nextErrors.packageWeightKg = 'Enter a package weight greater than 0.';
    }
    if (!Number.isInteger(currentStockBoxes) || currentStockBoxes < 0) {
      nextErrors.currentStockBoxes =
        'Stock must be a nonnegative whole number.';
    }
    if (!Number.isInteger(threshold) || threshold < 0) {
      nextErrors.threshold = 'Threshold must be a nonnegative whole number.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsPending(true);
      await updateProduct({
        productId: product.id,
        name: values.name,
        sku: values.sku,
        pricePerKg,
        packageWeightKg,
        currentStockBoxes,
        threshold,
      });
      toast.success(`${values.name.trim()} was updated.`);
      setErrors({});
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update product.';
      setErrors({ form: message });
      toast.error('Product could not be updated.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={compact ? 'icon-sm' : 'sm'}
            aria-label={`Edit ${product.name}`}
          />
        }
      >
        <Pencil data-icon={compact ? undefined : 'inline-start'} />
        {compact ? <span className="sr-only">Edit product</span> : 'Edit'}
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>
            Update catalog, pricing, and inventory details for {product.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="gap-5">
            {errors.form ? <FieldError>{errors.form}</FieldError> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor={`product-name-${product.id}`}>
                  Product name
                </FieldLabel>
                <Input
                  id={`product-name-${product.id}`}
                  value={values.name}
                  maxLength={200}
                  onChange={(event) => updateValue('name', event.target.value)}
                  aria-invalid={!!errors.name}
                  disabled={isPending}
                  autoFocus
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={!!errors.sku}>
                <FieldLabel htmlFor={`product-sku-${product.id}`}>
                  SKU
                </FieldLabel>
                <Input
                  id={`product-sku-${product.id}`}
                  value={values.sku}
                  maxLength={64}
                  onChange={(event) => updateValue('sku', event.target.value)}
                  aria-invalid={!!errors.sku}
                  disabled={isPending}
                />
                <FieldError>{errors.sku}</FieldError>
              </Field>

              <Field data-invalid={!!errors.pricePerKg}>
                <FieldLabel htmlFor={`product-price-${product.id}`}>
                  Price per kg
                </FieldLabel>
                <Input
                  id={`product-price-${product.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={values.pricePerKg}
                  onChange={(event) =>
                    updateValue('pricePerKg', event.target.value)
                  }
                  aria-invalid={!!errors.pricePerKg}
                  disabled={isPending}
                />
                <FieldError>{errors.pricePerKg}</FieldError>
              </Field>

              <Field data-invalid={!!errors.packageWeightKg}>
                <FieldLabel htmlFor={`product-weight-${product.id}`}>
                  Package weight (kg)
                </FieldLabel>
                <Input
                  id={`product-weight-${product.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={values.packageWeightKg}
                  onChange={(event) =>
                    updateValue('packageWeightKg', event.target.value)
                  }
                  aria-invalid={!!errors.packageWeightKg}
                  disabled={isPending}
                />
                <FieldError>{errors.packageWeightKg}</FieldError>
              </Field>

              <Field data-invalid={!!errors.currentStockBoxes}>
                <FieldLabel htmlFor={`product-stock-${product.id}`}>
                  Current stock (boxes)
                </FieldLabel>
                <Input
                  id={`product-stock-${product.id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={values.currentStockBoxes}
                  onChange={(event) =>
                    updateValue('currentStockBoxes', event.target.value)
                  }
                  aria-invalid={!!errors.currentStockBoxes}
                  disabled={isPending}
                />
                <FieldError>{errors.currentStockBoxes}</FieldError>
              </Field>

              <Field data-invalid={!!errors.threshold}>
                <FieldLabel htmlFor={`product-threshold-${product.id}`}>
                  Low-stock threshold (boxes)
                </FieldLabel>
                <Input
                  id={`product-threshold-${product.id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={values.threshold}
                  onChange={(event) =>
                    updateValue('threshold', event.target.value)
                  }
                  aria-invalid={!!errors.threshold}
                  disabled={isPending}
                />
                <FieldError>{errors.threshold}</FieldError>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor={`product-stock-weight-${product.id}`}>
                  Calculated stock
                </FieldLabel>
                <Input
                  id={`product-stock-weight-${product.id}`}
                  value={`${stockKg.toLocaleString('en-GB')} kg`}
                  readOnly
                  tabIndex={-1}
                />
                <FieldDescription>
                  Updating boxes or package weight recalculates stock kilograms.
                </FieldDescription>
              </Field>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
