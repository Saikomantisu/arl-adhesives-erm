import { useMemo, useState, type FormEvent } from 'react';
import { useConvexMutation } from '@convex-dev/react-query';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

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

const EMPTY_FORM: ProductFormValues = {
  name: '',
  sku: '',
  pricePerKg: '',
  packageWeightKg: '',
  currentStockBoxes: '0',
  threshold: '0',
};

export function ProductCreateDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ProductFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [isPending, setIsPending] = useState(false);
  const createProduct = useConvexMutation(convexApi.products.create);

  const initialStockKg = useMemo(() => {
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
    if (!nextOpen) {
      setValues(EMPTY_FORM);
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
      await createProduct({
        name: values.name,
        sku: values.sku,
        pricePerKg,
        packageWeightKg,
        currentStockBoxes,
        threshold,
      });
      toast.success(`${values.name.trim()} was added.`);
      setValues(EMPTY_FORM);
      setErrors({});
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add product.';
      setErrors({ form: message });
      toast.error('Product could not be added.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <PackagePlus data-icon="inline-start" />
        Add Product
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Add a product to inventory and make it available in sales documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="gap-5">
            {errors.form ? <FieldError>{errors.form}</FieldError> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="product-name">Product name</FieldLabel>
                <Input
                  id="product-name"
                  value={values.name}
                  onChange={(event) => updateValue('name', event.target.value)}
                  placeholder="Industrial adhesive"
                  maxLength={200}
                  aria-invalid={!!errors.name}
                  disabled={isPending}
                  autoFocus
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={!!errors.sku}>
                <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
                <Input
                  id="product-sku"
                  value={values.sku}
                  onChange={(event) => updateValue('sku', event.target.value)}
                  placeholder="ARL-001"
                  maxLength={64}
                  aria-invalid={!!errors.sku}
                  disabled={isPending}
                />
                <FieldError>{errors.sku}</FieldError>
              </Field>

              <Field data-invalid={!!errors.pricePerKg}>
                <FieldLabel htmlFor="product-price">Price per kg</FieldLabel>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={values.pricePerKg}
                  onChange={(event) =>
                    updateValue('pricePerKg', event.target.value)
                  }
                  placeholder="2750"
                  aria-invalid={!!errors.pricePerKg}
                  disabled={isPending}
                />
                <FieldError>{errors.pricePerKg}</FieldError>
              </Field>

              <Field data-invalid={!!errors.packageWeightKg}>
                <FieldLabel htmlFor="product-weight">
                  Package weight (kg)
                </FieldLabel>
                <Input
                  id="product-weight"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={values.packageWeightKg}
                  onChange={(event) =>
                    updateValue('packageWeightKg', event.target.value)
                  }
                  placeholder="25"
                  aria-invalid={!!errors.packageWeightKg}
                  disabled={isPending}
                />
                <FieldError>{errors.packageWeightKg}</FieldError>
              </Field>

              <Field data-invalid={!!errors.currentStockBoxes}>
                <FieldLabel htmlFor="product-stock">
                  Current stock (boxes)
                </FieldLabel>
                <Input
                  id="product-stock"
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
                <FieldLabel htmlFor="product-threshold">
                  Low-stock threshold (boxes)
                </FieldLabel>
                <Input
                  id="product-threshold"
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
                <FieldLabel htmlFor="product-initial-weight">
                  Calculated initial stock
                </FieldLabel>
                <Input
                  id="product-initial-weight"
                  value={`${initialStockKg.toLocaleString('en-GB')} kg`}
                  readOnly
                  tabIndex={-1}
                />
                <FieldDescription>
                  Current boxes × package weight. This value is calculated again
                  by the backend when the product is saved.
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
                  <PackagePlus data-icon="inline-start" />
                )}
                {isPending ? 'Adding…' : 'Add product'}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
