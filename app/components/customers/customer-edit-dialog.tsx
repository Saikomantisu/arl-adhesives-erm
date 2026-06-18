import { useState, type FormEvent } from 'react';
import { useConvexMutation } from '@convex-dev/react-query';
import { Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Customer } from '~/lib/data';
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const valuesFromCustomer = (customer: Customer): CustomerFormValues => ({
  company: customer.company,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
  payee: customer.payee,
  vatRegNo: customer.vat_reg_no,
});

export function CustomerEditDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomerFormValues>(() =>
    valuesFromCustomer(customer),
  );
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [isPending, setIsPending] = useState(false);
  const updateCustomer = useConvexMutation(convexApi.customers.update);

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
    if (nextOpen) {
      setValues(valuesFromCustomer(customer));
      setErrors({});
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: CustomerErrors = {};
    if (!values.company.trim()) {
      nextErrors.company = 'Company name is required.';
    }
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
      await updateCustomer({
        customerId: customer.id!,
        company: values.company,
        email: values.email,
        phone: values.phone,
        address: values.address,
        payee: values.payee,
        vatRegNo: values.vatRegNo,
      });
      toast.success(`${values.company.trim()} was updated.`);
      setErrors({});
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update customer.';
      setErrors({ form: message });
      toast.error('Customer could not be updated.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
      >
        <Pencil data-icon="inline-start" />
        Edit details
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>
            Update business and billing details for {customer.company}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="gap-5">
            {errors.form ? <FieldError>{errors.form}</FieldError> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.company}>
                <FieldLabel htmlFor={`customer-company-${customer.id}`}>
                  Company
                </FieldLabel>
                <Input
                  id={`customer-company-${customer.id}`}
                  value={values.company}
                  onChange={(event) =>
                    updateValue('company', event.target.value)
                  }
                  autoComplete="organization"
                  maxLength={160}
                  aria-invalid={!!errors.company}
                  disabled={isPending}
                  autoFocus
                />
                <FieldError>{errors.company}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor={`customer-email-${customer.id}`}>
                  Email
                </FieldLabel>
                <Input
                  id={`customer-email-${customer.id}`}
                  type="email"
                  value={values.email}
                  onChange={(event) => updateValue('email', event.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  aria-invalid={!!errors.email}
                  disabled={isPending}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor={`customer-phone-${customer.id}`}>
                  Phone
                </FieldLabel>
                <Input
                  id={`customer-phone-${customer.id}`}
                  type="tel"
                  value={values.phone}
                  onChange={(event) => updateValue('phone', event.target.value)}
                  autoComplete="tel"
                  maxLength={50}
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`customer-payee-${customer.id}`}>
                  Payee
                </FieldLabel>
                <Input
                  id={`customer-payee-${customer.id}`}
                  value={values.payee}
                  onChange={(event) => updateValue('payee', event.target.value)}
                  placeholder="Accounts department or contact"
                  maxLength={160}
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`customer-vat-${customer.id}`}>
                  VAT registration
                </FieldLabel>
                <Input
                  id={`customer-vat-${customer.id}`}
                  value={values.vatRegNo}
                  maxLength={100}
                  onChange={(event) =>
                    updateValue('vatRegNo', event.target.value)
                  }
                  disabled={isPending}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor={`customer-address-${customer.id}`}>
                  Address
                </FieldLabel>
                <Textarea
                  id={`customer-address-${customer.id}`}
                  value={values.address}
                  onChange={(event) =>
                    updateValue('address', event.target.value)
                  }
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
