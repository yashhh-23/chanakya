/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect, ReactNode, memo} from 'react';
import {useForm, UseFormReturn, SubmitHandler, FieldValues, Path} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {ZodType} from 'zod';

export interface ApiFieldError {
  field: string;
  message: string;
}

interface EntityFormProps<TFieldValues extends FieldValues> {
  schema: ZodType<TFieldValues>;
  onSubmit: (data: TFieldValues, helpers: UseFormReturn<TFieldValues, any, any>) => Promise<void> | void;
  children: (helpers: UseFormReturn<TFieldValues, any, any>) => ReactNode;
  defaultValues?: Partial<TFieldValues>;
  externalErrors?: ApiFieldError[];
  className?: string;
  id?: string;
}

export function EntityForm<TFieldValues extends FieldValues>({
  schema,
  onSubmit,
  children,
  defaultValues,
  externalErrors,
  className = '',
  id,
}: EntityFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues, any, any>({
    resolver: zodResolver(schema as any) as any,
    defaultValues: defaultValues as any,
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    setError,
    formState: {isSubmitting},
  } = methods;

  // Sync external errors into form controls
  useEffect(() => {
    if (externalErrors && externalErrors.length > 0) {
      externalErrors.forEach((err) => {
        // Safely set error on the field if it corresponds to an input field
        setError(err.field as Path<TFieldValues>, {
          type: 'server',
          message: err.message,
        });
      });
    }
  }, [externalErrors, setError]);

  const handleFormSubmit: SubmitHandler<TFieldValues> = async (data) => {
    try {
      await onSubmit(data, methods);
    } catch (err: any) {
      // Map general or server errors if custom catcher wasn't run
      setError('root' as Path<TFieldValues>, {
        type: 'server',
        message: err.message || 'An unexpected server error occurred.',
      });
    }
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`w-full ${className}`}
      noValidate
    >
      {/* Expose form methods to rendering child components */}
      {children(methods)}
    </form>
  );
}
