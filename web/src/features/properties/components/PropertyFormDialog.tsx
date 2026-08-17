import type { PropertyDetail, PropertyWriteRequest } from '@caseflow/api-types';
import {
  LAND_CLASSES,
  LAND_CLASS_LABELS,
  type PropertyWriteInput,
  optionsOf,
  propertyWriteSchema,
} from '@caseflow/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { isApiError } from '@/shared/api/errors';
import { useLocale } from '@/shared/i18n/use-locale';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';

import { useCreateProperty, useUpdateProperty } from '../api/use-properties';

interface FormValues {
  title: string;
  mouza: string;
  jl_no: string;
  district: string;
  upazila: string;
  land_class: string;
  total_area_decimal: string;
  address: string;
  boundaries: string;
  description: string;
}

const EMPTY: FormValues = {
  title: '',
  mouza: '',
  jl_no: '',
  district: '',
  upazila: '',
  land_class: '',
  total_area_decimal: '',
  address: '',
  boundaries: '',
  description: '',
};

function toRequest(values: PropertyWriteInput): PropertyWriteRequest {
  return {
    title: values.title,
    mouza: values.mouza || null,
    jl_no: values.jl_no || null,
    district: values.district || null,
    upazila: values.upazila || null,
    land_class: (values.land_class || null) as PropertyWriteRequest['land_class'],
    total_area_decimal: values.total_area_decimal,
    address: values.address || null,
    boundaries: values.boundaries || null,
    description: values.description || null,
  };
}

/** F-PROP-01 — সম্পত্তি তৈরি ও সম্পাদনা। */
export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** না দিলে তৈরি, দিলে সম্পাদনা। */
  property?: PropertyDetail;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty(property?.id ?? '');
  const mutation = property ? updateProperty : createProperty;

  const landClassOptions = useMemo(
    () => optionsOf(LAND_CLASSES, LAND_CLASS_LABELS, locale === 'en' ? 'EN' : 'BN'),
    [locale],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(propertyWriteSchema),
    defaultValues: property
      ? {
          ...EMPTY,
          title: property.title,
          mouza: property.mouza ?? '',
          jl_no: property.jl_no ?? '',
          district: property.district ?? '',
          upazila: property.upazila ?? '',
          land_class: property.land_class ?? '',
          total_area_decimal: property.total_area_decimal,
          address: property.address ?? '',
          boundaries: property.boundaries ?? '',
          description: property.description ?? '',
        }
      : EMPTY,
  });

  const messageFor = (key: keyof FormValues): string | undefined =>
    errors[key] ? t(errors[key]?.message ?? 'validation.required') : undefined;

  function submit(values: FormValues) {
    const body = toRequest(values);
    if (property) {
      updateProperty.mutate(body, { onSuccess: () => onOpenChange(false) });
    } else {
      createProperty.mutate(body, {
        onSuccess: (created) => {
          onOpenChange(false);
          navigate(`/properties/${created.id}`);
        },
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={property ? t('properties.editTitle') : t('properties.addTitle')}
      className="w-[min(42rem,calc(100vw-2rem))]"
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Input
          label={t('properties.fields.propertyTitle')}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- ফর্ম খোলার একমাত্র উদ্দেশ্যই এটি পূরণ করা
          autoFocus
          error={messageFor('title')}
          {...register('title')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('properties.fields.mouza')}
            error={messageFor('mouza')}
            {...register('mouza')}
          />
          <Input
            label={t('properties.fields.jlNo')}
            latin
            error={messageFor('jl_no')}
            {...register('jl_no')}
          />
          <Input
            label={t('properties.fields.district')}
            error={messageFor('district')}
            {...register('district')}
          />
          <Input
            label={t('properties.fields.upazila')}
            error={messageFor('upazila')}
            {...register('upazila')}
          />
          <Select
            label={t('properties.fields.landClass')}
            options={landClassOptions}
            placeholder="—"
            error={messageFor('land_class')}
            {...register('land_class')}
          />
          <Input
            label={t('properties.fields.area')}
            latin
            inputMode="decimal"
            placeholder="33.000"
            error={messageFor('total_area_decimal')}
            {...register('total_area_decimal')}
          />
        </div>

        <Textarea
          label={t('properties.fields.address')}
          rows={2}
          error={messageFor('address')}
          {...register('address')}
        />
        <Textarea
          label={t('properties.fields.boundaries')}
          rows={2}
          error={messageFor('boundaries')}
          {...register('boundaries')}
        />
        <Textarea
          label={t('properties.fields.description')}
          rows={2}
          error={messageFor('description')}
          {...register('description')}
        />

        {mutation.error ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {t(isApiError(mutation.error) ? mutation.error.i18nKey : 'errors.unknown')}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
