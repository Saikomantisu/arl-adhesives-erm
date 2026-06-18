import { useState, type FormEvent } from 'react';
import { useConvexMutation } from '@convex-dev/react-query';
import { Plus } from 'lucide-react';
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { Textarea } from '~/components/ui/textarea';

type CustomerFormValues = {
  company: string;
  email: string;
  phone: string;
  address: string;
  payee: string;
  vatRegNo: string;
};

type CustomerField = keyof CustomerFormValues;
type CustomerErrors = Partial<Record<CustomerField | 'form', string>>;

const EMPTY_FORM: CustomerFormValues = {
  company: '',
  email: '',
  phone: '',
  address: '',
  payee: '',
  vatRegNo: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerCreateDialog({
  label = 'Add Customer',
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomerFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [isPending, setIsPending] = useState(false);
  const createCustomer = useConvexMutation(convexApi.customers.create);

  const updateValue = (field: CustomerField, value: string) => {
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

    const nextErrors: CustomerErrors = {};
    if (!values.company.trim())
      nextErrors.company = 'Company name is required.';
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsPending(true);
      await createCustomer({
        company: values.company,
        email: values.email,
        phone: values.phone,
        address: values.address,
        payee: values.payee,
        vatRegNo: values.vatRegNo,
      });
      toast.success(`${values.company.trim()} was added.`);
      setValues(EMPTY_FORM);
      setErrors({});
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add customer.';
      setErrors({ form: message });
      toast.error('Customer could not be added.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
          <DialogDescription>
            Create a customer profile for invoices, quotations, and custom
            pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="gap-5">
            {errors.form ? <FieldError>{errors.form}</FieldError> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.company}>
                <FieldLabel htmlFor="customer-company">Company</FieldLabel>
                <Input
                  id="customer-company"
                  value={values.company}
                  onChange={(event) =>
                    updateValue('company', event.target.value)
                  }
                  placeholder="Acme Manufacturing"
                  autoComplete="organization"
                  maxLength={160}
                  aria-invalid={!!errors.company}
                  disabled={isPending}
                  autoFocus
                />
                <FieldError>{errors.company}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                <Input
                  id="customer-email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateValue('email', event.target.value)}
                  placeholder="accounts@example.com"
                  autoComplete="email"
                  maxLength={254}
                  aria-invalid={!!errors.email}
                  disabled={isPending}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={values.phone}
                  onChange={(event) => updateValue('phone', event.target.value)}
                  placeholder="+94 11 234 5678"
                  autoComplete="tel"
                  maxLength={50}
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-payee">Payee</FieldLabel>
                <Input
                  id="customer-payee"
                  value={values.payee}
                  onChange={(event) => updateValue('payee', event.target.value)}
                  placeholder="Accounts department or contact"
                  maxLength={160}
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-vat">VAT registration</FieldLabel>
                <Input
                  id="customer-vat"
                  value={values.vatRegNo}
                  onChange={(event) =>
                    updateValue('vatRegNo', event.target.value)
                  }
                  placeholder="VAT registration number"
                  maxLength={100}
                  disabled={isPending}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="customer-address">Address</FieldLabel>
                <Textarea
                  id="customer-address"
                  value={values.address}
                  onChange={(event) =>
                    updateValue('address', event.target.value)
                  }
                  placeholder="Billing or business address"
                  autoComplete="street-address"
                  maxLength={1000}
                  disabled={isPending}
                />
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
                  <Plus data-icon="inline-start" />
                )}
                {isPending ? 'Adding…' : 'Add customer'}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
