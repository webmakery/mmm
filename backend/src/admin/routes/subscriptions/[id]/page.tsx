import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  SubscriptionData,
  SubscriptionInfrastructureAttempt,
  SubscriptionInfrastructureAuditLog,
  SubscriptionInfrastructureData,
  SubscriptionPlanData,
} from "../../../types"
import { sdk } from "../../../lib/sdk"

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString()
}

const SubscriptionPage = () => {
  const { id } = useParams()
  const [serverType, setServerType] = useState("")
  const [location, setLocation] = useState("")
  const [image, setImage] = useState("")

  const { data, isLoading, refetch } = useQuery<{
    subscription: SubscriptionData
    infrastructure: SubscriptionInfrastructureData | null
    subscription_plan: SubscriptionPlanData | null
    attempt_history: SubscriptionInfrastructureAttempt[]
    admin_audit_trail: SubscriptionInfrastructureAuditLog[]
  }>({
    queryFn: () => sdk.client.fetch(`/admin/subscriptions/${id}`),
    queryKey: ["subscription", id],
  })

  const retryMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/subscriptions/${id}/infrastructure/retry`, {
        method: "POST",
        body: {
          server_type: serverType || undefined,
          location: location || undefined,
          image: image || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Provisioning retry started")
      refetch()
    },
    onError: () => {
      toast.error("Provisioning retry failed")
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/subscriptions/${id}/infrastructure/cancel`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Infrastructure marked as cancelled")
      refetch()
    },
    onError: () => {
      toast.error("Failed to cancel infrastructure")
    },
  })

  const infrastructure = data?.infrastructure
  const subscriptionPlanMetadata = (data?.subscription_plan?.metadata ||
    null) as Record<string, unknown> | null
  const isDeletedInfrastructure = infrastructure?.status === "deleted"

  const readMetadataField = (...candidates: string[]) => {
    if (!subscriptionPlanMetadata) {
      return null
    }

    const normalized = new Map(
      Object.entries(subscriptionPlanMetadata).map(([key, value]) => [
        key.toLowerCase().replace(/[_\s-]/g, ""),
        value,
      ])
    )

    for (const candidate of candidates) {
      const value = normalized.get(candidate.toLowerCase().replace(/[_\s-]/g, ""))
      if (value !== undefined && value !== null && value !== "") {
        return String(value)
      }
    }

    return null
  }

  const planDisk =
    readMetadataField("disk", "disk_gb", "storage", "storage_gb", "ssd", "volume") || "-"
  const planBandwidth =
    readMetadataField("bandwidth", "transfer", "traffic", "network") || "-"

  const statusColor = useMemo(() => {
    switch (infrastructure?.status) {
      case "active":
        return "green"
      case "failed":
        return "red"
      case "cancelled":
      case "deleted":
        return "orange"
      default:
        return "grey"
    }
  }, [infrastructure?.status])

  return (
    <Container>
      {isLoading && <span>Loading...</span>}
      {data?.subscription && (
        <>
          <Heading level="h1">Orders of Subscription #{data.subscription.id}</Heading>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>#</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>View Order</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.subscription.orders?.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>{order.id}</Table.Cell>
                  <Table.Cell>{new Date(order.created_at).toDateString()}</Table.Cell>
                  <Table.Cell>
                    <Link to={`/orders/${order.id}`}>View Order</Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <Heading level="h2">Infrastructure</Heading>
          {!infrastructure ? (
            <Text>No infrastructure record found for this subscription.</Text>
          ) : (
            <>
              <Heading level="h3">Purchased server summary</Heading>
              <Table>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Customer email</Table.Cell>
                    <Table.Cell>{data.subscription.customer?.email || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Order</Table.Cell>
                    <Table.Cell>{infrastructure.order_id || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Server IP</Table.Cell>
                    <Table.Cell>{infrastructure.server_ip || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>vCPU</Table.Cell>
                    <Table.Cell>{infrastructure.server_cpu || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>RAM</Table.Cell>
                    <Table.Cell>
                      {infrastructure.server_ram_gb ? `${infrastructure.server_ram_gb} GB` : "-"}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Disk / storage</Table.Cell>
                    <Table.Cell>{planDisk}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Server type</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_server_type || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Region</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_region || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Image</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_image || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Bandwidth</Table.Cell>
                    <Table.Cell>{planBandwidth}</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>

              <Table>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Status</Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColor}>{infrastructure.status}</Badge>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Failure reason</Table.Cell>
                    <Table.Cell>{infrastructure.last_error || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Retry count</Table.Cell>
                    <Table.Cell>{infrastructure.provisioning_retry_count || 0}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Server type</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_server_type}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Image</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_image}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Location</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_region}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Provider server id</Table.Cell>
                    <Table.Cell>{infrastructure.hetzner_server_id || "-"}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Created</Table.Cell>
                    <Table.Cell>{formatDate(infrastructure.created_at)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Updated</Table.Cell>
                    <Table.Cell>{formatDate(infrastructure.updated_at)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Last provisioning start</Table.Cell>
                    <Table.Cell>
                      {formatDate(infrastructure.last_provisioning_started_at)}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Last provisioning finish</Table.Cell>
                    <Table.Cell>
                      {formatDate(infrastructure.last_provisioning_finished_at)}
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>

              <Heading level="h3">Retry provisioning</Heading>
              {isDeletedInfrastructure ? (
                <Text>
                  Provisioning cannot be retried because this server was deleted.
                </Text>
              ) : (
                <>
                  <Label>Override location</Label>
                  <Input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={infrastructure.hetzner_region}
                  />
                  <Label>Override server type</Label>
                  <Input
                    value={serverType}
                    onChange={(event) => setServerType(event.target.value)}
                    placeholder={infrastructure.hetzner_server_type}
                  />
                  <Label>Override image (optional)</Label>
                  <Input
                    value={image}
                    onChange={(event) => setImage(event.target.value)}
                    placeholder={infrastructure.hetzner_image}
                  />
                  <div className="flex items-center gap-x-2">
                    <Button
                      onClick={() => retryMutation.mutate()}
                      isLoading={retryMutation.isPending}
                    >
                      Retry provisioning
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => cancelMutation.mutate()}
                      isLoading={cancelMutation.isPending}
                    >
                      Mark infrastructure cancelled
                    </Button>
                  </div>
                </>
              )}

              <Heading level="h3">Provisioning attempt history</Heading>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Attempt</Table.HeaderCell>
                    <Table.HeaderCell>Triggered by</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Server</Table.HeaderCell>
                    <Table.HeaderCell>Started</Table.HeaderCell>
                    <Table.HeaderCell>Finished</Table.HeaderCell>
                    <Table.HeaderCell>Error</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.attempt_history.map((attempt) => (
                    <Table.Row key={attempt.id}>
                      <Table.Cell>{attempt.attempt_number}</Table.Cell>
                      <Table.Cell>{attempt.triggered_by}</Table.Cell>
                      <Table.Cell>{attempt.status}</Table.Cell>
                      <Table.Cell>{attempt.provider_server_id || "-"}</Table.Cell>
                      <Table.Cell>{formatDate(attempt.started_at)}</Table.Cell>
                      <Table.Cell>{formatDate(attempt.finished_at)}</Table.Cell>
                      <Table.Cell>{attempt.error_message || "-"}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              <Heading level="h3">Admin audit trail</Heading>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Time</Table.HeaderCell>
                    <Table.HeaderCell>Action</Table.HeaderCell>
                    <Table.HeaderCell>Actor</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.admin_audit_trail.map((audit) => (
                    <Table.Row key={audit.id}>
                      <Table.Cell>{formatDate(audit.created_at)}</Table.Cell>
                      <Table.Cell>{audit.action}</Table.Cell>
                      <Table.Cell>{audit.actor_id || "-"}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </>
          )}
        </>
      )}
    </Container>
  )
}

export default SubscriptionPage
