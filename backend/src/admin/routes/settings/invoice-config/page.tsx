import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import * as zod from "@medusajs/framework/zod"
import { sdk } from "../../../lib/sdk"

type InvoiceConfig = {
  id: string
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  company_logo?: string
  notes?: string
}

const schema = zod.object({
  company_name: zod.string().optional(),
  company_address: zod.string().optional(),
  company_phone: zod.string().optional(),
  company_email: zod.string().email().optional(),
  company_logo: zod.string().url().optional(),
  notes: zod.string().optional(),
})

const InvoiceConfigPage = () => {
  const { data, isLoading, refetch } = useQuery<{
    invoice_config: InvoiceConfig
  }>({
    queryFn: () => sdk.client.fetch("/admin/invoice-config"),
    queryKey: ["invoice-config"],
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: zod.infer<typeof schema>) =>
      sdk.client.fetch("/admin/invoice-config", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      refetch()
      toast.success("Invoice config updated successfully")
    },
  })

  const getFormDefaultValues = useCallback(
    () => ({
      company_name: data?.invoice_config.company_name || "",
      company_address: data?.invoice_config.company_address || "",
      company_phone: data?.invoice_config.company_phone || "",
      company_email: data?.invoice_config.company_email || "",
      company_logo: data?.invoice_config.company_logo || "",
      notes: data?.invoice_config.notes || "",
    }),
    [data]
  )

  const form = useForm<zod.infer<typeof schema>>({
    defaultValues: getFormDefaultValues(),
  })

  const handleSubmit = form.handleSubmit((formData) => mutateAsync(formData))

  useEffect(() => {
    form.reset(getFormDefaultValues())
  }, [form, getFormDefaultValues])

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const { files } = await sdk.admin.upload.create({
      files: [file],
    })

    form.setValue("company_logo", files[0].url)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Invoice Config</Heading>
      </div>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden p-2 gap-2">
          <Controller
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Company Name
                </Label>
                <Input {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="company_address"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Company Address
                </Label>
                <Textarea {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="company_phone"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Company Phone
                </Label>
                <Input {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="company_email"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Company Email
                </Label>
                <Input {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Notes
                </Label>
                <Textarea {...field} />
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="company_logo"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Company Logo
                </Label>
                <Input type="file" onChange={uploadLogo} className="py-1" />
                {field.value ? <Input value={field.value} readOnly /> : null}
              </div>
            )}
          />
          <Button type="submit" disabled={isLoading || isPending}>
            Save
          </Button>
        </form>
      </FormProvider>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Default Invoice Config",
})

export default InvoiceConfigPage
