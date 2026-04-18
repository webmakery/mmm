import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PlusMini, Trash } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../../../lib/sdk"

type Role = { id: string; key: string; name: string }
type TeamMember = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  assigned_roles: Role[]
}
type Invite = {
  id: string
  email: string
  assigned_roles: Role[]
}

const TeamSettingsPage = () => {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")
  const [assignByUser, setAssignByUser] = useState<Record<string, string>>({})

  const { data: rolesData } = useQuery<{ roles: Role[] }>({
    queryKey: ["rbac-roles"],
    queryFn: () => sdk.client.fetch("/admin/rbac/roles"),
  })

  const { data, isLoading } = useQuery<{ members: TeamMember[]; invites: Invite[] }>({
    queryKey: ["rbac-team"],
    queryFn: () => sdk.client.fetch("/admin/rbac/team"),
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/rbac/team/invites", {
        method: "POST",
        body: { email: email.trim(), role_ids: [inviteRoleId] },
      }),
    onSuccess: () => {
      toast.success("Invite sent")
      setEmail("")
      queryClient.invalidateQueries({ queryKey: ["rbac-team"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to send invite"),
  })

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      sdk.client.fetch(`/admin/rbac/team/${userId}/roles`, {
        method: "POST",
        body: { role_ids: [roleId] },
      }),
    onSuccess: () => {
      toast.success("Role assigned")
      queryClient.invalidateQueries({ queryKey: ["rbac-team"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to assign role"),
  })

  const removeMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      sdk.client.fetch(`/admin/rbac/team/${userId}/roles/${roleId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Role removed")
      queryClient.invalidateQueries({ queryKey: ["rbac-team"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to remove role"),
  })

  const roles = rolesData?.roles || []
  const defaultInviteRole = useMemo(() => roles.find((role) => role.key === "viewer")?.id || roles[0]?.id || "", [roles])

  useEffect(() => {
    if (!inviteRoleId && defaultInviteRole) {
      setInviteRoleId(defaultInviteRole)
    }
  }, [defaultInviteRole, inviteRoleId])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Team Members</Heading>
          <Text size="small" className="text-ui-fg-subtle">Invite team members and manage role assignments.</Text>
        </div>
      </div>

      <div className="px-6 py-4 flex items-end gap-2">
        <div className="flex-1">
          <Text size="small" className="mb-1 text-ui-fg-subtle">Email</Text>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
        </div>
        <div className="w-[240px]">
          <Text size="small" className="mb-1 text-ui-fg-subtle">Role</Text>
          <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
            <Select.Trigger>
              <Select.Value placeholder="Select role" />
            </Select.Trigger>
            <Select.Content>
              {roles.map((role) => (
                <Select.Item key={role.id} value={role.id}>{role.name}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <Button disabled={!email.trim() || !inviteRoleId || inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
          <PlusMini /> Invite
        </Button>
      </div>

      <div className="px-6 py-4">
        <Heading level="h2">Members</Heading>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>User</Table.HeaderCell>
              <Table.HeaderCell>Roles</Table.HeaderCell>
              <Table.HeaderCell>Assign Role</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(data?.members || []).map((member) => (
              <Table.Row key={member.id}>
                <Table.Cell>
                  <Text weight="plus">{[member.first_name, member.last_name].filter(Boolean).join(" ") || "No name"}</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">{member.email}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {member.assigned_roles?.map((role) => (
                      <Badge key={role.id} color="grey" size="2xsmall" className="flex items-center gap-1">
                        {role.name}
                        <button type="button" onClick={() => removeMutation.mutate({ userId: member.id, roleId: role.id })}>
                          <Trash />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Select value={assignByUser[member.id] || ""} onValueChange={(value) => setAssignByUser((prev) => ({ ...prev, [member.id]: value }))}>
                      <Select.Trigger>
                        <Select.Value placeholder="Select role" />
                      </Select.Trigger>
                      <Select.Content>
                        {roles.map((role) => (
                          <Select.Item key={role.id} value={role.id}>{role.name}</Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Button
                      size="small"
                      disabled={!assignByUser[member.id]}
                      onClick={() => assignMutation.mutate({ userId: member.id, roleId: assignByUser[member.id] })}
                    >
                      Assign
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {!isLoading && !(data?.members || []).length ? <Text size="small">No team members found.</Text> : null}
      </div>

      <div className="px-6 py-4">
        <Heading level="h2">Pending Invites</Heading>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Assigned Roles</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(data?.invites || []).map((invite) => (
              <Table.Row key={invite.id}>
                <Table.Cell>{invite.email}</Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {invite.assigned_roles.map((role) => (
                      <Badge key={role.id} size="2xsmall" color="blue">{role.name}</Badge>
                    ))}
                  </div>
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
  label: "Team",
})

export default TeamSettingsPage
