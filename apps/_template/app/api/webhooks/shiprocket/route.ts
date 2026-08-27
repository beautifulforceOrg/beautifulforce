// packages/shipping's default handler already updates by gatewayOrderId
// rather than creating a row, so it composes directly with this
// storefront's pre-created-order model with no wrapper needed.
export { POST } from "@storeforge/shipping";
