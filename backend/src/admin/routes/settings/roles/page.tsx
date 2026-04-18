import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Trash } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../../lib/sdk"

type Role = {
  id: string
  key: string
  name: string
  description?: string | null
  permissions: string[]
  is_system: boolean
}

const RolesPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ key: "", name: "", description: "", permissions: "" })

  const { data } = useQuery<{ roles: Role[] }>({
    queryKey: ["rbac-roles"],
    queryFn: () => sdk.client.fetch("/admin/rbac/roles"),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/rbac/roles", {
        method: "POST",
        body: {
          key: form.key.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permissions: form.permissions.split(",").map((p) => p.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Role created")
      setForm({ key: "", name: "", description: "", permissions: "" })
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to create role"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/rbac/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Role deleted")
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to delete role"),
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Roles</Heading>
        <Text size="small" className="text-ui-fg-subtle">Create and review role permission sets for admin team members.</Text>
      </div>

      <div className="px-6 py-4 grid grid-cols-1 gap-2">
        <Input placeholder="role_key" value={form.key} onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))} />
        <Input placeholder="Role name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        <Textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <Input
          placeholder="permissions.read, team.read"
          value={form.permissions}
          onChange={(e) => setForm((prev) => ({ ...prev, permissions: e.target.value }))}
        />
        <Button disabled={!form.key.trim() || !form.name.trim()} onClick={() => createMutation.mutate()}>Create role</Button>
      </div>

      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Permissions</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(data?.roles || []).map((role) => (
              <Table.Row key={role.id}>
                <Table.Cell>
                  <Text weight="plus">{role.name}</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">{role.key}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} size="2xsmall" color="grey">{permission}</Badge>
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {role.is_system ? null : (
                    <Button size="small" variant="secondary" onClick={() => deleteMutation.mutate(role.id)}>
                      <Trash />
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Roles",
})

export default RolesPage
